import { ExpoConfig, ConfigContext } from 'expo/config';
import versionInfo from './version.json';

/**
 * Dynamic Expo config — reads versionCode from version.json.
 * 
 * This means you NEVER manually edit versionCode.
 * Instead, run: ./release.sh android  (or ./release.sh tv)
 * The script auto-increments version.json and compiles the APK.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: 'Nuba',
    slug: 'nuba-streaming',
    version: versionInfo.versionName,
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'nuba',
    userInterfaceStyle: 'dark',
    newArchEnabled: true,
    splash: {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#030612',
    },
    ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.nuba.streaming',
    },
    android: {
        package: 'com.nuba.streaming',
        // ← This is the key: taken from version.json automatically
        versionCode: versionInfo.versionCode,
        adaptiveIcon: {
            foregroundImage: './assets/images/adaptive-icon.png',
            backgroundColor: '#030612',
        },
        edgeToEdgeEnabled: true,
        permissions: [
            'android.permission.RECORD_AUDIO',
            'android.permission.MODIFY_AUDIO_SETTINGS',
            'android.permission.REQUEST_INSTALL_PACKAGES',
        ],
    },
    web: {
        bundler: 'metro',
        output: 'static',
        favicon: './assets/images/favicon.png',
    },
    plugins: [
        'expo-router',
        ['expo-screen-orientation', { initialOrientation: 'DEFAULT' }],
        'expo-video',
        'expo-audio',
        'expo-asset',
    ],
    experiments: { typedRoutes: true },
    extra: {
        // Expose versionCode to the runtime via Constants.expoConfig.extra
        versionCode: versionInfo.versionCode,
        versionName: versionInfo.versionName,
        router: {},
        eas: { projectId: '46671ccc-18af-408f-90d4-fe2b85b94ab5' },
    },
    owner: 'pancy1312',
});

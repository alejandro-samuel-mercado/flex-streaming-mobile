import re

with open('app/watch/[id].tsx', 'r') as f:
    content = f.read()

# 1. Update imports
content = content.replace("import Video from 'react-native-video';", "import { useVideoPlayer, VideoView } from 'expo-video';")

# 2. Update NobaVideoPlayer to use expo-video
new_player = """const NobaVideoPlayer = React.memo(({
    streamSrc,
    videoRef,
    resizeMode,
    onStatus,
    setError,
    onPlayerError,
    shouldPlay,
    width,
    height,
    onLoad,
    isMuted,
}: any) => {
    const player = useVideoPlayer(streamSrc, (p) => {
        p.loop = false;
        p.muted = isMuted;
        if (shouldPlay) p.play();
    });

    React.useEffect(() => {
        if (shouldPlay) player.play();
        else player.pause();
    }, [shouldPlay]);

    React.useEffect(() => {
        player.muted = isMuted;
    }, [isMuted]);

    React.useEffect(() => {
        const sub1 = player.addListener('statusChange', (s: any) => {
            if (s.status === 'error') {
                onPlayerError?.('network_blip');
                setError("Error de reproducción. Reintentando...");
            } else if (s.status === 'readyToPlay') {
                if (onLoad) onLoad({ duration: player.duration });
            }
        });
        
        const sub2 = player.addListener('playingChange', (s: any) => {
            onStatus({
                isLoaded: true,
                positionMillis: player.currentTime * 1000,
                durationMillis: player.duration * 1000,
                isPlaying: s.isPlaying,
                isBuffering: false
            });
        });

        const sub3 = player.addListener('timeUpdate', () => {
            onStatus({
                isLoaded: true,
                positionMillis: player.currentTime * 1000,
                durationMillis: player.duration * 1000,
                isPlaying: player.playing,
                isBuffering: false
            });
        });

        // Pass imperative methods to WatchScreen via ref
        if (videoRef) {
            videoRef.current = {
                seek: (seconds: number) => { player.currentTime = seconds; },
                setPositionAsync: async (millis: number) => { player.currentTime = millis / 1000; },
                playAsync: async () => { player.play(); },
                pauseAsync: async () => { player.pause(); },
                setIsMutedAsync: async (m: boolean) => { player.muted = m; },
                unloadAsync: async () => {},
                loadAsync: async () => {}
            };
        }

        return () => {
            sub1.remove();
            sub2.remove();
            sub3.remove();
        };
    }, [player, onStatus, setError, onLoad, onPlayerError]);

    return (
        <VideoView
            key="noba-video-player"
            player={player}
            style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000' }]}
            contentFit={resizeMode === 'contain' ? 'contain' : 'cover'}
            nativeControls={false}
        />
    );
}, (prev, next) => prev.resizeMode === next.resizeMode && prev.streamSrc === next.streamSrc && prev.shouldPlay === next.shouldPlay && prev.isMuted === next.isMuted && prev.width === next.width && prev.height === next.height);
"""

content = re.sub(r"const NobaVideoPlayer = React\.memo\(\(\{(.*?)\}\) \=\> \{.*?\}\,\s*\w+\.\w+\s*\=\=\=\s*\w+\.\w+.*?\);", new_player, content, flags=re.DOTALL)

with open('app/watch/[id].tsx', 'w') as f:
    f.write(content)

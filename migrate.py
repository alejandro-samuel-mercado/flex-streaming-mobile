import re

with open('app/watch/[id].tsx', 'r') as f:
    content = f.read()

# 1. Update imports
content = content.replace("import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';", "import Video from 'react-native-video';")

# 2. Update NobaVideoPlayer
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
    return (
        <Video
            key="noba-video-player"
            ref={videoRef}
            source={streamSrc ? { uri: streamSrc } : undefined}
            style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000' }]}
            resizeMode={resizeMode}
            paused={!shouldPlay}
            muted={isMuted}
            useTextureView={false}
            bufferConfig={{
                minBufferMs: 30000,
                maxBufferMs: 120000,
                bufferForPlaybackMs: 5000,
                bufferForPlaybackAfterRebufferMs: 10000
            }}
            onProgress={(data) => {
                onStatus({
                    isLoaded: true,
                    positionMillis: data.currentTime * 1000,
                    durationMillis: data.seekableDuration * 1000,
                    isPlaying: shouldPlay
                });
            }}
            onBuffer={({ isBuffering }) => {
                onStatus({ isLoaded: true, isBuffering, isPlaying: shouldPlay });
            }}
            onEnd={() => {
                onStatus({ isLoaded: true, didJustFinish: true });
            }}
            onError={(err) => {
                console.error("RNVideo error:", err);
                onPlayerError?.('network_blip');
                setError("Error de reproducción. Reintentando...");
            }}
            onLoad={(data) => {
                onStatus({ isLoaded: true, durationMillis: data.duration * 1000, positionMillis: 0, isPlaying: shouldPlay });
                if (onLoad) onLoad(data);
            }}
        />
    );
}, (prev, next) => prev.resizeMode === next.resizeMode && prev.streamSrc === next.streamSrc && prev.shouldPlay === next.shouldPlay && prev.isMuted === next.isMuted && prev.width === next.width && prev.height === next.height);
"""
# Replace NobaVideoPlayer block
content = re.sub(r"const NobaVideoPlayer = React\.memo\(\(\{(.*?)\}\) \=\> \{.*?\}\,\s*\w+\.\w+\s*\=\=\=\s*\w+\.\w+.*?\);", new_player, content, flags=re.DOTALL)

# 3. Add isMuted prop to NobaVideoPlayer instantiation
content = content.replace("width={SW}", "width={SW}\n                    isMuted={isMuted}")

# 4. Replace imperative calls
content = re.sub(r"videoRef\.current\.setPositionAsync\((.*?)\)\.catch\(\(\)\=\>\{\}\);", r"videoRef.current.seek((\1) / 1000);", content)
content = re.sub(r"videoRef\.current\?\.setPositionAsync\((.*?)\)\.catch\(\(\)\=\>\{\}\);", r"videoRef.current?.seek((\1) / 1000);", content)

content = re.sub(r"videoRef\.current\.playAsync\(\)\.catch\(\(\)\=\>\{\}\);?", "", content)
content = re.sub(r"videoRef\.current\?\.playAsync\(\)\.catch\(\(\)\=\>\{\}\);?", "", content)

content = re.sub(r"videoRef\.current\.pauseAsync\(\)\.catch\(\(\)\=\>\{\}\);?", "", content)
content = re.sub(r"videoRef\.current\?\.pauseAsync\(\)\.catch\(\(\)\=\>\{\}\);?", "", content)

content = re.sub(r"videoRef\.current\.setIsMutedAsync\(.*?\)\.catch\(\(\)\=\>\{\}\);?", "", content)

# 5. Fix unload/load manual logic
content = re.sub(r"videoRef\.current\.unloadAsync\(\)\.then\(\(\) \=\> videoRef\.current\.loadAsync\(\{ uri: url \}, \{ shouldPlay: true \}, false\)\)\.catch\(\(\)\=\>\{\}\);?", "", content)

with open('app/watch/[id].tsx', 'w') as f:
    f.write(content)

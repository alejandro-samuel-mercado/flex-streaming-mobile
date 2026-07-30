import re

with open('app/watch/[id].tsx', 'r') as f:
    content = f.read()

# 1. Update imports
content = content.replace("import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';", "import Video from 'react-native-video';")

# 2. Update NobaVideoPlayer to react-native-video
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
            selectedAudioTrack={{ type: "default" }}
            bufferConfig={{
                minBufferMs: 30000,
                maxBufferMs: 120000,
                bufferForPlaybackMs: 5000,
                bufferForPlaybackAfterRebufferMs: 10000
            }}
            onProgress={(data: any) => {
                onStatus({
                    isLoaded: true,
                    positionMillis: data.currentTime * 1000,
                    durationMillis: data.seekableDuration * 1000,
                    isPlaying: shouldPlay
                });
            }}
            onBuffer={({ isBuffering }: any) => {
                onStatus({ isLoaded: true, isBuffering, isPlaying: shouldPlay });
            }}
            onEnd={() => {
                onStatus({ isLoaded: true, didJustFinish: true });
            }}
            onError={(err: any) => {
                console.error("RNVideo error:", err);
                onPlayerError?.('network_blip');
                setError("Error de reproducción. Reintentando...");
            }}
            onLoad={(data: any) => {
                onStatus({ isLoaded: true, durationMillis: data.duration * 1000, positionMillis: 0, isPlaying: shouldPlay });
                if (onLoad) onLoad(data);
            }}
        />
    );
}, (prev: any, next: any) => prev.resizeMode === next.resizeMode && prev.streamSrc === next.streamSrc && prev.shouldPlay === next.shouldPlay && prev.isMuted === next.isMuted && prev.width === next.width && prev.height === next.height);
"""

# Replace NobaVideoPlayer block
content = re.sub(r"const NobaVideoPlayer = React\.memo\(\(\{(.*?)\}\) \=\> \{.*?\}\,\s*\(\w+\:\s*any\,\s*\w+\:\s*any\)\s*\=\>\s*prev\.resizeMode\s*\=\=\=\s*next\.resizeMode.*?\);", new_player, content, flags=re.DOTALL)

# Now we need to convert WatchScreen's methods: setPositionAsync -> seek (seconds instead of millis)
# We have to be very careful because we might have videoRef.current.setPositionAsync(resumeTime * 1000)
# and we need videoRef.current.seek(resumeTime)

content = re.sub(r"videoRef\.current\.setPositionAsync\((.*?)\)\.catch\(\(\)\=\>\{\}\);", r"videoRef.current.seek((\1) / 1000);", content)
content = re.sub(r"videoRef\.current\?\.setPositionAsync\((.*?)\)\.catch\(\(\)\=\>\{\}\);", r"videoRef.current?.seek((\1) / 1000);", content)

content = re.sub(r"videoRef\.current\.playAsync\(\)\.catch\(\(\)\=\>\{\}\);?", "", content)
content = re.sub(r"videoRef\.current\?\.playAsync\(\)\.catch\(\(\)\=\>\{\}\);?", "", content)

content = re.sub(r"videoRef\.current\.pauseAsync\(\)\.catch\(\(\)\=\>\{\}\);?", "", content)
content = re.sub(r"videoRef\.current\?\.pauseAsync\(\)\.catch\(\(\)\=\>\{\}\);?", "", content)

content = re.sub(r"videoRef\.current\.setIsMutedAsync\(.*?\)\.catch\(\(\)\=\>\{\}\);?", "", content)
content = re.sub(r"videoRef\.current\.unloadAsync\(\)\.then\(\(\) \=\> videoRef\.current\.loadAsync\(\{ uri: url \}, \{ shouldPlay: true \}, false\)\)\.catch\(\(\)\=\>\{\}\);?", "", content)

with open('app/watch/[id].tsx', 'w') as f:
    f.write(content)

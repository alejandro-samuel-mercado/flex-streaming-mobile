import re

with open('app/watch/[id].tsx', 'r') as f:
    content = f.read()

# 1. Update imports
content = content.replace("import { useVideoPlayer, VideoView } from 'expo-video';", "import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';")

# 2. Restore NobaVideoPlayer to expo-av (with forwardRef wrapper to handle seek/playAsync conversions if needed)
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
    // We attach the actual expo-av Video to videoRef so the rest of the file works
    return (
        <Video
            key="noba-video-player"
            ref={videoRef}
            source={streamSrc ? { uri: streamSrc } : undefined}
            style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000' }]}
            resizeMode={resizeMode === 'contain' ? ResizeMode.CONTAIN : ResizeMode.COVER}
            onPlaybackStatusUpdate={onStatus}
            progressUpdateIntervalMillis={1000}
            useNativeControls={false}
            onLoad={onLoad}
            isMuted={isMuted}
            shouldPlay={shouldPlay}
            shouldCorrectPitch={false}
        />
    );
}, (prev: any, next: any) => prev.resizeMode === next.resizeMode && prev.streamSrc === next.streamSrc && prev.shouldPlay === next.shouldPlay && prev.isMuted === next.isMuted && prev.width === next.width && prev.height === next.height);
"""

# The regex needs to match the expo-video NobaVideoPlayer block we just made.
content = re.sub(r"const NobaVideoPlayer = React\.memo\(\(\{(.*?)\}\) \=\> \{.*?\}\,\s*\(\w+\:\s*any\,\s*\w+\:\s*any\)\s*\=\>\s*prev\.resizeMode\s*\=\=\=\s*next\.resizeMode.*?\);", new_player, content, flags=re.DOTALL)

# Now, we need to make sure WatchScreen's methods are correct. 
# Previously we changed videoRef.current.setPositionAsync(...) to videoRef.current.seek(...) 
# Since we are returning to expo-av, we MUST use setPositionAsync (or add a mock). Let's just sed replace seek back to setPositionAsync.
content = re.sub(r"videoRef\.current\.seek\(\((.*?)\) \/ 1000\);", r"videoRef.current.setPositionAsync(\1).catch(()=>{});", content)
content = re.sub(r"videoRef\.current\?\.seek\(\((.*?)\) \/ 1000\);", r"videoRef.current?.setPositionAsync(\1).catch(()=>{});", content)

# Wait! The onLoad initial seek uses `seek((resumeTime * 1000) / 1000)`
content = content.replace("videoRef.current.seek((resumeTime * 1000) / 1000);", "videoRef.current.setPositionAsync(resumeTime * 1000).catch(()=>{});")

with open('app/watch/[id].tsx', 'w') as f:
    f.write(content)

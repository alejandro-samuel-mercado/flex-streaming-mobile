import { useEventListener } from 'expo';
import { BlurView } from 'expo-blur';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as NavigationBar from 'expo-navigation-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import Video from 'react-native-video';
import { AlertCircle, ArrowLeft, Check, ChevronDown, ChevronRight, Clock, Languages, List, Lock, Maximize, MessageSquare, Minimize, Pause, Play, RotateCcw, RotateCw, Settings, SkipBack, SkipForward, Smartphone, Unlock, Volume2, VolumeX, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { fetchApi } from '../../lib/api-client';
import { API_BASE_URL, API_ROUTES } from '../../lib/api-routes';
import { scale } from '../../lib/responsive';
import { Storage as AppStorage, StorageKeys } from '../../lib/storage';
import { parseVTT, SubtitleCue } from '../../lib/vtt-parser';
import { Colors } from '../../theme/colors';


// Isolated Video component to prevent any UI-induced re-renders
const NobaVideoPlayer = React.memo(({
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

export default function WatchScreen() {
    const { width: SW, height: SH } = useWindowDimensions();
    const router = useRouter();
    const { loading: authLoading, user: authUser } = useAuth();

    // Stable IDs that never change during the lifecycle of the screen
    // This prevents Expo Router's unstable search params from triggering reloads
    const rawParams = useLocalSearchParams<{ id: string, episodeId?: string }>();
    const screenIds = useRef({ id: rawParams.id, episodeId: rawParams.episodeId });
    const { id, episodeId } = screenIds.current;

    const insets = useSafeAreaInsets();

    const [content, setContent] = useState<any>(null);
    const [currentEpisode, setCurrentEpisode] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isBuffering, setIsBuffering] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const retryCount = useRef(0);
    const streamUrlRef = useRef<string | null>(null);
    const lastPositionRef = useRef(0);
    const [streamSrc, setStreamSrc] = useState<string | null>(null);
    const [showControls, setShowControls] = useState(true);
    const controlsOpacity = useSharedValue(1);
    const { width: W, height: H } = useWindowDimensions();
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [resizeMode, setResizeMode] = useState<'contain' | 'cover'>('contain');
    const positionSV = useSharedValue(0);
    const durationSV = useSharedValue(0);
    const [displayTime, setDisplayTime] = useState({ pos: 0, dur: 0 });
    const [streamData, setStreamData] = useState<any>(null);
    const [activeMenu, setActiveMenu] = useState<'episodes' | 'subs' | 'audio' | 'quality' | null>(null);
    const [selectedQuality, setSelectedQuality] = useState('Auto');
    
    // Subtitles Engine State
    const [selectedSubtitle, setSelectedSubtitle] = useState<any>(null);
    const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);
    const subtitleCuesRef = useRef<SubtitleCue[]>([]);
    const [currentSubtitleText, setCurrentSubtitleText] = useState<string>('');
    
    const [isLocked, setIsLocked] = useState(false);
    const [showLockIndicator, setShowLockIndicator] = useState(false);
    const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [resumeTime, setResumeTime] = useState<number | null>(null);
    const [showResumePopup, setShowResumePopup] = useState(false);
    const videoRef = useRef<any>(null);
    const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    const isSeeking = useSharedValue(false);
    const seekProgress = useSharedValue(0);
    const positionRef = useRef(0);
    const durationRef = useRef(0);

    // Fetch and parse VTT subtitle file when selectedSubtitle changes
    useEffect(() => {
        if (!selectedSubtitle || !selectedSubtitle.url) {
            setSubtitleCues([]);
            subtitleCuesRef.current = [];
            setCurrentSubtitleText('');
            return;
        }

        const fetchSubtitles = async () => {
            try {
                // Ensure the URL is absolute
                const baseUrl = streamData?.streamBaseUrl || API_BASE_URL.replace('/api', '');
                const url = selectedSubtitle.url.startsWith('http') 
                    ? selectedSubtitle.url 
                    : `${baseUrl}${selectedSubtitle.url.startsWith('/') ? '' : '/'}${selectedSubtitle.url}`;

                const response = await fetch(url);
                if (response.ok) {
                    const text = await response.text();
                    const parsedCues = parseVTT(text);
                    setSubtitleCues(parsedCues);
                    subtitleCuesRef.current = parsedCues;
                } else {
                    console.error('[WatchScreen] VTT Fetch failed:', response.status);
                    setSubtitleCues([]);
                    subtitleCuesRef.current = [];
                }
            } catch (error) {
                console.error('[WatchScreen] Error fetching VTT:', error);
                setSubtitleCues([]);
                subtitleCuesRef.current = [];
            }
        };

        fetchSubtitles();
    }, [selectedSubtitle, streamData?.streamBaseUrl]);

    const onSeek = async (percent: number) => {
        try {
            const dur = durationSV.value;
            if (dur > 0) {
                const targetPos = Math.floor(dur * percent);
                positionSV.value = targetPos;
                positionRef.current = targetPos;
                // Avoid calling play right after setPosition as it can freeze
                if (videoRef.current) { videoRef.current.seek((targetPos) / 1000); }
            }
        } catch (e) {
            console.error("Seek error:", e);
        } finally {
            isSeeking.value = false;
        }
    };

    const barWidth = W > H ? W - 80 : W - 40;

    const gesture = Gesture.Pan()
        .activeCursor('pointer')
        .onBegin((e) => {
            isSeeking.value = true;
            seekProgress.value = Math.max(0, Math.min(1, e.x / barWidth)) * 100;
        })
        .onUpdate((e) => {
            seekProgress.value = Math.max(0, Math.min(1, e.x / barWidth)) * 100;
        })
        .onEnd((e) => {
            const p = Math.max(0, Math.min(1, e.x / barWidth));
            runOnJS(onSeek)(p);
        });

    const tap = Gesture.Tap()
        .onBegin((e) => {
            isSeeking.value = true;
            seekProgress.value = Math.max(0, Math.min(1, e.x / barWidth)) * 100;
        })
        .onEnd((e) => {
            const p = Math.max(0, Math.min(1, e.x / barWidth));
            runOnJS(onSeek)(p);
        });

    const combinedGesture = Gesture.Exclusive(gesture, tap);

    const animatedProgressStyle = useAnimatedStyle(() => {
        const p = isSeeking.value ? seekProgress.value : (durationSV.value > 0 ? (positionSV.value / durationSV.value) * 100 : 0);
        return { width: `${p}%` };
    });



    useEffect(() => {
        // Auto-hide on mount
        controlsTimer.current = setTimeout(() => {
            setShowControls(false);
            controlsOpacity.value = withTiming(0, { duration: 300 });
        }, 4000);

        return () => {
            if (controlsTimer.current) clearTimeout(controlsTimer.current);
        };
    }, []);

    const allEpisodes = useMemo(() => {
        if (!content?.seasons) return [];
        return content.seasons.flatMap((s: any) => (s.episodes || []).map((e: any) => ({ ...e, seasonNumber: s.number })));
    }, [content?.seasons]);

    const sidebarScrollRef = useRef<ScrollView>(null);

    const seasonsWithEpisodes = useMemo(() => {
        if (!content?.seasons) return [];
        return content.seasons.map((s: any) => ({
            ...s,
            episodes: (s.episodes || []).map((e: any) => ({ ...e, seasonNumber: s.number }))
        }));
    }, [content?.seasons]);

    const activeEpId = currentEpisode?.id || episodeId;

    const [expandedSeasons, setExpandedSeasons] = useState<Record<number, boolean>>({});

    useEffect(() => {
        if (activeMenu === 'episodes') {
            const currentEpObj = allEpisodes.find((e: any) => String(e.id) === String(activeEpId));
            const sNum = currentEpObj?.seasonNumber || content?.seasons?.[0]?.number || 1;
            setExpandedSeasons(prev => ({ ...prev, [sNum]: true }));
        }
    }, [activeMenu, allEpisodes, activeEpId, content]);

    const toggleSeason = useCallback((sNum: number) => {
        setExpandedSeasons(prev => ({ ...prev, [sNum]: !prev[sNum] }));
    }, []);

    const currentIdx = useMemo(() => {
        if (!currentEpisode) return -1;
        return allEpisodes.findIndex((e: any) => e.id === currentEpisode.id);
    }, [allEpisodes, currentEpisode]);

    const hasNext = currentIdx >= 0 && currentIdx < allEpisodes.length - 1;
    const hasPrev = currentIdx > 0;

    // Default to sensor-based orientation
    useEffect(() => {
        const prepare = async () => {
            try {
                // Keep the current orientation (don't force portrait)
                await activateKeepAwakeAsync();
            } catch (e) { }
        };
        prepare();
        return () => {
            const cleanup = async () => {
                try {
                    await deactivateKeepAwake();
                    // Force portrait before leaving the player to stabilize the rest of the app
                    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                } catch (e) { }
            };
            cleanup();
        };
    }, []);

    // Load all video data in parallel for maximum speed
    useEffect(() => {
        if (authLoading) return;
        if (!authUser) {
            setError('Inicia sesión para ver este contenido');
            setLoading(false);
            return;
        }

        // Since id and episodeId are now stable refs, this effect will only run once per screen mount.
        // The guard is kept just in case.
        if (content && content.id === id && (!episodeId || currentEpisode?.id === episodeId)) {
            return;
        }

        const load = async () => {
            setLoading(true);
            setContent(null);
            setCurrentEpisode(null);
            setError(null);
            setResumeTime(null);
            setShowResumePopup(false);
            hasInitialSeeked.current = false;
            hasStartedRef.current = false;

            try {
                // 1. Fetch content info and history in parallel
                const [contentRes, historyRes] = await Promise.all([
                    fetchApi<any>(`${API_ROUTES.CONTENT.BASE}/${id}`),
                    fetchApi<any>(`${API_ROUTES.HISTORY.BASE}/${id}${episodeId ? `?episodeId=${episodeId}` : ''}`)
                ]);

                if (!contentRes.success || !contentRes.data) throw new Error('No se pudo cargar el contenido');
                const data = contentRes.data;
                setContent(data);

                // 2. Determine target episode
                let targetEpId = episodeId;
                if (!targetEpId && historyRes.success && historyRes.data?.episodeId) {
                    targetEpId = historyRes.data.episodeId;
                }

                let ep = null;
                if (targetEpId && data.seasons) {
                    for (const s of data.seasons) {
                        ep = s.episodes?.find((e: any) => e.id === targetEpId);
                        if (ep) { ep.seasonNumber = s.number; break; }
                    }
                } else if (data.type !== 'MOVIE' && data.seasons?.[0]?.episodes?.[0]) {
                    ep = data.seasons[0].episodes[0];
                    ep.seasonNumber = data.seasons[0].number;
                }

                if (ep) {
                    setCurrentEpisode(ep);
                    targetEpId = ep.id;
                }

                // 3. Handle resume progress - Store in local var first to ensure accuracy
                let finalResumeTime = 0;
                if (historyRes.success && historyRes.data && Number(historyRes.data.progress) > 10) {
                    finalResumeTime = Number(historyRes.data.progress);
                    setResumeTime(finalResumeTime);
                    setShowResumePopup(true);
                    setIsPlaying(false);
                } else {
                    setIsPlaying(true);
                }

                // 4. Request stream access IMMEDIATELY
                const streamJson = await fetchApi<any>(API_ROUTES.STREAM.REQUEST_ACCESS, {
                    method: 'POST',
                    body: JSON.stringify({ contentId: id, episodeId: targetEpId }),
                });

                if (streamJson.success && streamJson.data) {
                    const { token, videoFileId, streamBaseUrl } = streamJson.data;
                    const videos = ep ? ep.videoFiles : data.videoFiles;
                    const vf = videos?.find((v: any) => v.id === videoFileId) || videos?.[0];
                    const filename = vf?.masterPlaylist?.split('/').pop() || 'master.m3u8';
                    // Use the storage node URL if provided, otherwise fall back to the main API
                    // If streamBaseUrl is used, it does NOT contain /api, so we must add it here, or ensure we strip it if it already has it.
                    // Safely strip /api from streamBaseUrl to avoid /api/api/stream/hls double prefix
                    const safeStreamBase = streamBaseUrl ? streamBaseUrl.replace(/\/api\/?$/, '') : null;
                    const streamHost = safeStreamBase || API_BASE_URL.replace(/\/api\/?$/, '');
                    const url = `${streamHost}/api/stream/hls/${videoFileId}/${filename}?token=${token}`;
                    console.log('🎬 [WatchScreen] Requesting Video URL:', url);
                    setStreamSrc(url);
                    streamUrlRef.current = url;
                    retryCount.current = 0;
                    setStreamData(streamJson.data);

                    // Imperative load with generous pre-buffer settings
                    // Segments are 30s long — player MUST buffer enough before starting
                    // to avoid immediate freeze after the first few seconds.
                } else {
                    throw new Error(streamJson.error || 'Error al obtener stream');
                }

            } catch (e: any) {
                console.error("Load error:", e);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id, episodeId]);



    // Slow UI update for time text (every 1s)
    useEffect(() => {
        const uiTimer = setInterval(() => {
            setDisplayTime({ pos: positionRef.current, dur: durationRef.current });
        }, 1000);
        return () => clearInterval(uiTimer);
    }, []);

    useEffect(() => {
        // Reset local refs when movie/episode changes
        positionRef.current = 0;
        durationRef.current = 0;

        if (progressTimer.current) clearInterval(progressTimer.current);

        progressTimer.current = setInterval(async () => {
            if (!content || durationRef.current === 0) return;
            
            const currentProgress = Math.floor(positionRef.current / 1000);
            const currentDuration = Math.floor(durationRef.current / 1000);

            // Evitar guardar progreso si es menos de 30 segundos (evita falsos positivos al entrar)
            // o si ya casi termina la película.
            if (currentProgress < 30 || (currentDuration > 0 && currentProgress > currentDuration * 0.95)) return;

            try {
                await fetchApi(API_ROUTES.HISTORY.PROGRESS, {
                    method: 'POST',
                    body: JSON.stringify({
                        contentId: content.id,
                        episodeId: currentEpisode?.id,
                        progress: currentProgress,
                        duration: currentDuration
                    }),
                });
            } catch (e) { }

        }, 15000); // Save every 15s instead of 10s to reduce DB load
        
        return () => { if (progressTimer.current) clearInterval(progressTimer.current); };
    }, [content?.id, currentEpisode?.id]); // Usar IDs específicos en lugar de los objetos completos
    const toggleControls = () => {
        if (isLocked) {
            setShowLockIndicator(true);
            if (lockTimer.current) clearTimeout(lockTimer.current);
            lockTimer.current = setTimeout(() => setShowLockIndicator(false), 3000);
            return;
        }

        if (controlsTimer.current) {
            clearTimeout(controlsTimer.current);
            controlsTimer.current = null;
        }

        const isVisible = controlsOpacity.value > 0.5;
        if (isVisible) {
            controlsOpacity.value = withTiming(0, { duration: 300 }, () => {
                runOnJS(setShowControls)(false);
            });
        } else {
            setShowControls(true);
            controlsOpacity.value = withTiming(1, { duration: 300 });
            controlsTimer.current = setTimeout(() => {
                controlsOpacity.value = withTiming(0, { duration: 300 }, () => {
                    runOnJS(setShowControls)(false);
                });
            }, 4000);
        }
    };

    const animatedControlsStyle = useAnimatedStyle(() => ({
        opacity: controlsOpacity.value,
    }), []);

    useEffect(() => {
        const lock = async () => {
            try {
                await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
            } catch (e) { }
        };
        lock();
        return () => {
            const unlock = async () => {
                try {
                    await ScreenOrientation.unlockAsync();
                    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                } catch (e) { }
            };
            unlock();
        };
    }, []);

    const toggleOrientation = async () => {
        const orientation = await ScreenOrientation.getOrientationAsync();
        if (orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT || orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT) {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        } else {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        }
    };

    // Fullscreen / Immersive mode
    useEffect(() => {
        const enableImmersive = async () => {
            try {
                if (Platform.OS === 'android') {
                    // overlay-swipe ensures bars overlay content and don't push it
                    await NavigationBar.setBehaviorAsync('overlay-swipe');
                    await NavigationBar.setVisibilityAsync('hidden');
                }
            } catch (e) { }
        };
        enableImmersive();
        return () => {
            const disableImmersive = async () => {
                try {
                    if (Platform.OS === 'android') {
                        await NavigationBar.setBehaviorAsync('inset-touch');
                        await NavigationBar.setVisibilityAsync('visible');
                    }
                } catch (e) { }
            };
            disableImmersive();
        };
    }, []);

    const toggleResizeMode = () => {
        setResizeMode(prev => prev === 'contain' ? 'cover' : 'contain');
    };

    const formatTime = (ms: number) => {
        const sec = Math.floor(ms / 1000);
        const h = Math.floor(sec / 3600); const m = Math.floor((sec % 3600) / 60); const s = sec % 60;
        return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
    };

    const [accessToken, setAccessToken] = useState<string | null>(null);

    useEffect(() => {
        const getToken = async () => {
            const token = await AppStorage.get(StorageKeys.ACCESS_TOKEN);
            setAccessToken(token);
        };
        getToken();
    }, []);

    const hasInitialSeeked = useRef(false);
    const hasStartedRef = useRef(false);

    // Stable ref to access current state inside stable onStatus
    const stateRef = useRef({ resumeTime, hasNext, currentIdx });
    useEffect(() => {
        stateRef.current = { resumeTime, hasNext, currentIdx };
    }, [resumeTime, hasNext, currentIdx]);

    const isPlayingRef = useRef(true);

    const onStatus = useCallback((status: any) => {
        if (!status.isLoaded) {
            // Transient not-loaded state — don't crash on it
            if (status.error) {
                const isNullError = !status.error || String(status.error).toLowerCase().includes('null');
                if (!isNullError) setError(status.error);
            }
            return;
        }

        // Write to shared values and refs only - ZERO re-renders
        positionSV.value = status.positionMillis;
        durationSV.value = status.durationMillis || 0;
        positionRef.current = status.positionMillis;
        durationRef.current = status.durationMillis || 0;
        lastPositionRef.current = status.positionMillis;

        if (status.isPlaying !== isPlayingRef.current) {
            isPlayingRef.current = status.isPlaying;
            setIsPlaying(status.isPlaying);
        }

        // Detect buffering — show spinner so user knows it's loading, not frozen
        if (status.isBuffering !== undefined) {
            setIsBuffering(status.isBuffering);
        }

        // --- Subtitle Synchronization Engine ---
        if (subtitleCuesRef.current && subtitleCuesRef.current.length > 0) {
            const posSec = status.positionMillis / 1000;
            // Find the active cue
            const activeCue = subtitleCuesRef.current.find(cue => posSec >= cue.start && posSec <= cue.end);
            setCurrentSubtitleText(activeCue ? activeCue.text : '');
        } else {
            // Keep it clear if no subtitles are active to avoid hanging text
            setCurrentSubtitleText('');
        }

        const { hasNext: hn } = stateRef.current;

        if (status.didJustFinish) {
            if (hn) goNext();
            else router.back();
        }
    }, []); 

    const goNext = () => { if (!hasNext) return; router.replace(`/watch/${id}?episodeId=${allEpisodes[currentIdx + 1].id}` as any); };
    const goPrev = () => { if (!hasPrev) return; router.replace(`/watch/${id}?episodeId=${allEpisodes[currentIdx - 1].id}` as any); };

    if (loading && !content) return (
        <View style={s.loader}>
            <ActivityIndicator size="large" color={Colors.primary} />
        </View>
    );

    if (error || !content) return <View style={s.loader}><AlertCircle size={48} color={Colors.primary} /><Text style={s.errorTitle}>Error</Text><Text style={s.loaderText}>{error || 'No encontrado'}</Text><TouchableOpacity style={s.retryBtn} onPress={() => router.back()}><Text style={s.retryText}>Volver</Text></TouchableOpacity></View>;

    const title = currentEpisode
        ? `${content.translations?.[0]?.title} — T${currentEpisode.seasonNumber}E${currentEpisode.number}`
        : content.translations?.[0]?.title || '';



    return (
        <View style={s.container}>
            <StatusBar hidden={true} />

            {/* Screen Lock Overlay */}
            {isLocked && showLockIndicator && (
                <View style={s.lockOverlay}>
                    <TouchableOpacity style={s.unlockBtn} onPress={() => setIsLocked(false)}>
                        <Unlock size={32} color={Colors.white} />
                        <Text style={s.lockText}>Pantalla Bloqueada</Text>
                        <Text style={s.lockText}>Toca para desbloquear</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Video Layer - Isolated in a bunker */}
            {streamSrc ? (
                <NobaVideoPlayer
                    streamSrc={streamSrc}
                    videoRef={videoRef}
                    resizeMode={resizeMode}
                    shouldPlay={isPlaying}
                    width={SW}
                    isMuted={isMuted}
                    height={SH}
                    onStatus={onStatus}
                    onLoad={(status: any) => {
                        if (!hasInitialSeeked.current && resumeTime && resumeTime > 10 && videoRef.current) {
                            videoRef.current.seek((resumeTime * 1000) / 1000);
                            hasInitialSeeked.current = true;
                        }
                    }}
                    setError={setError}
                    onPlayerError={async (type: string) => {
                        if (type !== 'network_blip') return;
                        if (retryCount.current >= 3) {
                            setError('Error de reproducción. Verifica tu conexión a internet.');
                            return;
                        }
                        retryCount.current += 1;
                        const url = streamUrlRef.current;
                        const savedPos = lastPositionRef.current;
                        if (!url || !videoRef.current) return;
                        try {
                            setIsBuffering(true);
                            
                            await new Promise(r => setTimeout(r, 1500));
                            
                            if (savedPos > 2000) {
                                videoRef.current.seek((savedPos) / 1000);
                            }
                        } catch (e) {
                            setError('Error al reconectar el stream.');
                        } finally {
                            setIsBuffering(false);
                        }
                    }}
                />
            ) : null}

            {/* Custom VTT Subtitles Overlay */}
            {currentSubtitleText ? (
                <View style={s.subtitleOverlay} pointerEvents="none">
                    <Text style={s.subtitleText}>{currentSubtitleText}</Text>
                </View>
            ) : null}

            {!streamSrc && (
                <View style={[s.loader, StyleSheet.absoluteFill]}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            )}



            {/* Auto-recovery handler for network blips */}
            {/* Passed as prop to the isolated player so it doesn't trigger re-renders */}

            {/* Controls Toggle Layer */}
            <TouchableOpacity
                style={StyleSheet.absoluteFillObject}
                activeOpacity={1}
                onPress={toggleControls}
            />

            {error && (
                <View style={s.errorContainer}>
                    <AlertCircle size={48} color={Colors.error} />
                    <Text style={s.errorTitle}>¡Ups! Algo salió mal</Text>
                    <Text style={s.errorText}>{error}</Text>
                    <TouchableOpacity style={s.retryBtn} onPress={() => router.back()}>
                        <Text style={s.retryText}>Volver</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Controls overlay */}
            <Animated.View
                style={[StyleSheet.absoluteFill, animatedControlsStyle]}
                pointerEvents={showControls ? 'auto' : 'none'}
            >
                {!isLocked && (
                    <>
                        {/* Top */}
                        <View style={[s.topBar, {
                            paddingTop: W > H ? 20 : Math.max(insets.top, 16),
                            paddingLeft: W > H ? 40 : 20,
                            paddingRight: W > H ? 40 : 20
                        }]}>
                            <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}><ArrowLeft size={22} color={Colors.white} /></TouchableOpacity>
                            <View style={{ flex: 1 }}><Text style={s.titleText} numberOfLines={1}>{title}</Text></View>
                            {content.seasons?.length > 0 && (
                                <TouchableOpacity style={s.epBtn} onPress={() => setActiveMenu('episodes')}><List size={16} color={Colors.white} /><Text style={s.epBtnText}>Episodios</Text></TouchableOpacity>
                            )}
                        </View>

                        {/* Center */}
                        <View style={s.centerControls}>
                            <TVPlaybackButton onPress={() => {
                                const newPos = Math.max(0, positionRef.current - 20000);
                                positionSV.value = newPos;
                                positionRef.current = newPos;
                                if (videoRef.current) { videoRef.current.seek((newPos) / 1000); }
                            }} onFocus={() => setShowControls(true)}>
                                <RotateCcw size={scale(32)} color="rgba(255,255,255,0.8)" />
                                <Text style={s.skipText}>20s</Text>
                            </TVPlaybackButton>
                            <TVPlaybackButton style={s.playBtn} onPress={() => {
                                if (isPlaying) {
                                    setIsPlaying(false);
                                    
                                } else {
                                    setIsPlaying(true);
                                    
                                }
                            }} onFocus={() => setShowControls(true)}>
                                {isPlaying ? <Pause size={scale(36)} fill={Colors.white} color={Colors.white} /> : <Play size={scale(36)} fill={Colors.white} color={Colors.white} style={{ marginLeft: 4 }} />}
                            </TVPlaybackButton>
                            <TVPlaybackButton onPress={() => {
                                const newPos = Math.min(durationRef.current, positionRef.current + 20000);
                                positionSV.value = newPos;
                                positionRef.current = newPos;
                                if (videoRef.current) { videoRef.current.seek((newPos) / 1000); }
                            }} onFocus={() => setShowControls(true)}>
                                <RotateCw size={scale(32)} color="rgba(255,255,255,0.8)" />
                                <Text style={s.skipText}>20s</Text>
                            </TVPlaybackButton>
                        </View>

                        {/* Bottom */}
                        <View style={[s.bottomBar, {
                            paddingBottom: W > H ? 20 : Math.max(insets.bottom, 16),
                            paddingLeft: W > H ? 40 : 20,
                            paddingRight: W > H ? 40 : 20
                        }]}>
                            <GestureDetector gesture={combinedGesture}>
                                <View style={s.progressWrap}>
                                    <View style={s.progressBg}>
                                        <Animated.View style={[s.progressFill, animatedProgressStyle]}>
                                            <View style={s.progressThumb} />
                                        </Animated.View>
                                    </View>
                                </View>
                            </GestureDetector>

                            <View style={s.bottomRow}>
                                <View style={s.timeRow}>
                                    <Text style={s.time}>{formatTime(displayTime.pos)}</Text>
                                    <Text style={s.timeDur}> / {formatTime(displayTime.dur)}</Text>
                                </View>

                                <View style={s.actionsRow}>
                                    {/* Volume */}
                                    <TouchableOpacity onPress={() => {
                                        const nextMute = !isMuted;
                                        setIsMuted(nextMute);
                                        if (videoRef.current) {  }
                                    }} style={s.actionBtn}>
                                        {isMuted ? <VolumeX size={20} color={Colors.white} /> : <Volume2 size={20} color={Colors.white} />}
                                    </TouchableOpacity>

                                    {/* Episodes Nav */}
                                    {(hasNext || hasPrev) && (
                                        <>
                                            {W > H && <View style={s.divider} />}
                                            {hasPrev && <TouchableOpacity onPress={goPrev} style={s.actionBtn}><SkipBack size={20} color={Colors.white} /></TouchableOpacity>}
                                            {hasNext && <TouchableOpacity onPress={goNext} style={s.actionBtn}><SkipForward size={20} color={Colors.white} /></TouchableOpacity>}
                                        </>
                                    )}

                                    {/* Player Settings */}
                                    {W > H && <View style={s.divider} />}
                                    {W > H && (
                                        <TouchableOpacity onPress={toggleResizeMode} style={s.actionBtn}>
                                            {resizeMode === 'contain' ? <Maximize size={18} color={Colors.white} /> : <Minimize size={18} color={Colors.white} />}
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity onPress={() => setActiveMenu('subs')} style={s.actionBtn}><MessageSquare size={18} color={Colors.white} /></TouchableOpacity>
                                    {W > H && <TouchableOpacity onPress={() => setActiveMenu('quality')} style={s.actionBtn}><Settings size={18} color={Colors.white} /></TouchableOpacity>}
                                    {W > H && (
                                        <TouchableOpacity onPress={() => setIsLocked(true)} style={s.actionBtn}>
                                            <Lock size={18} color={Colors.white} />
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity onPress={toggleOrientation} style={s.actionBtn}>
                                        <Smartphone size={18} color={Colors.white} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </>
                )}
            </Animated.View>

            {/* Sidebar / Settings Menus */}
            {activeMenu && (
                <View style={[
                    activeMenu === 'episodes' ? s.sidebar : s.settingsMenu,
                    {
                        paddingTop: W > H ? 20 : insets.top + 20,
                        paddingBottom: W > H ? 20 : insets.bottom + 20,
                        paddingRight: W > H ? 20 : insets.right + 20,
                        paddingLeft: activeMenu === 'episodes' ? 20 : 20
                    }
                ]}>
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8, 12, 20, 0.96)' }]} />
                    <View style={s.sidebarHeader}>
                        <Text style={s.sidebarTitle}>
                            {activeMenu === 'episodes' ? 'Episodios' :
                                activeMenu === 'subs' ? 'Subtítulos' : 'Calidad'}
                        </Text>
                        <TouchableOpacity onPress={() => setActiveMenu(null)}><X size={24} color={Colors.white} /></TouchableOpacity>
                    </View>

                    <View style={{ flex: 1 }}>
                        {activeMenu === 'episodes' && (
                            <ScrollView ref={sidebarScrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                                {seasonsWithEpisodes.map((se: any, sIdx: number) => {
                                    const isExpanded = !!expandedSeasons[se.number];
                                    const isCurrentSeason = se.episodes.some((e: any) => String(e.id) === String(activeEpId));
                                    return (
                                        <View key={se.id || sIdx} style={{ marginBottom: 6 }}>
                                            {/* Season Header */}
                                            <TouchableOpacity
                                                onPress={() => toggleSeason(se.number)}
                                                style={[s.seasonHeader, isCurrentSeason && s.seasonHeaderCurrent]}
                                                activeOpacity={0.8}
                                            >
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                    {isExpanded ? (
                                                        <ChevronDown size={18} color={Colors.white} />
                                                    ) : (
                                                        <ChevronRight size={18} color={Colors.white} />
                                                    )}
                                                    <Text style={s.seasonTitle}>
                                                        Temporada {se.number}
                                                    </Text>
                                                </View>
                                                <Text style={s.seasonCount}>
                                                    {se.episodes.length} ep.
                                                </Text>
                                            </TouchableOpacity>

                                            {/* Expanded Episodes with Indentation */}
                                            {isExpanded && (
                                                <View style={s.episodesContainer}>
                                                    {se.episodes.map((ep: any, epIdx: number) => {
                                                        const isCurrentEp = String(activeEpId) === String(ep.id);
                                                        return (
                                                            <TouchableOpacity
                                                                key={ep.id || epIdx}
                                                                onLayout={isCurrentEp ? (e: any) => {
                                                                    if (sidebarScrollRef.current) {
                                                                        const y = e.nativeEvent.layout.y;
                                                                        const offset = Math.max(0, (sIdx * 60) + y - 100);
                                                                        sidebarScrollRef.current.scrollTo({ y: offset, animated: false });
                                                                    }
                                                                } : undefined}
                                                                onPress={() => { setActiveMenu(null); router.replace(`/watch/${id}?episodeId=${ep.id}` as any); }}
                                                                style={[s.epItem, isCurrentEp && s.epItemActive]}
                                                                activeOpacity={0.8}
                                                            >
                                                                <View style={[s.epNum, isCurrentEp && s.epNumActive]}>
                                                                    <Text style={[s.epNumText, isCurrentEp && { color: Colors.black }]}>{ep.number ?? ''}</Text>
                                                                </View>
                                                                <View style={{ flex: 1 }}>
                                                                    <Text style={[s.epName, isCurrentEp && { color: Colors.primary }]} numberOfLines={1}>
                                                                        {ep.translations?.[0]?.title || `Episodio ${ep.number ?? ''}`}
                                                                    </Text>
                                                                    <Text style={{ color: Colors.textMuted, fontSize: 11 }}>
                                                                        {ep.durationSeconds ? `${Math.round(ep.durationSeconds / 60)} min` : `Temporada ${se.number}`}
                                                                    </Text>
                                                                </View>
                                                                {isCurrentEp && (
                                                                    <View style={s.playingBadge}>
                                                                        <Text style={s.playingText}>Viendo</Text>
                                                                    </View>
                                                                )}
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        )}

                        {activeMenu !== 'episodes' && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {activeMenu === 'subs' && (
                                    <>
                                        <TouchableOpacity style={[s.menuItem, !selectedSubtitle && s.menuItemActive]} onPress={() => { setSelectedSubtitle(null); setActiveMenu(null); }}>
                                            <Text style={s.menuItemText}>Desactivados</Text>
                                            {!selectedSubtitle && <Check size={16} color={Colors.primary} />}
                                        </TouchableOpacity>
                                        {(streamData?.subtitleTracks || currentEpisode?.videoFiles?.[0]?.subtitleTracks || content.videoFiles?.[0]?.subtitleTracks)?.map((sub: any, i: number) => {
                                            const isActive = selectedSubtitle?.url === sub.url;
                                            return (
                                                <TouchableOpacity key={i} style={[s.menuItem, isActive && s.menuItemActive]} onPress={() => { setSelectedSubtitle(sub); setActiveMenu(null); }}>
                                                    <Text style={s.menuItemText}>{sub.label || sub.language}</Text>
                                                    {isActive && <Check size={16} color={Colors.primary} />}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </>
                                )}

                                

                                {activeMenu === 'quality' && (
                                    <>
                                        <TouchableOpacity style={[s.menuItem, selectedQuality === 'Auto' && s.menuItemActive]} onPress={() => { setSelectedQuality('Auto'); setActiveMenu(null); }}>
                                            <Text style={s.menuItemText}>Automática (Recomendado)</Text>
                                            {selectedQuality === 'Auto' && <Check size={16} color={Colors.primary} />}
                                        </TouchableOpacity>
                                        {streamData?.qualities?.map((q: any, i: number) => (
                                            <TouchableOpacity key={i} style={[s.menuItem, selectedQuality === q.resolution && s.menuItemActive]} onPress={() => { setSelectedQuality(q.resolution); setActiveMenu(null); }}>
                                                <Text style={s.menuItemText}>{q.resolution}p</Text>
                                                {selectedQuality === q.resolution && <Check size={16} color={Colors.primary} />}
                                            </TouchableOpacity>
                                        ))}
                                    </>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            )}

            {/* Resume Popup - Placed here to ensure it is the topmost layer */}
            {showResumePopup && (
                <View style={s.resumeOverlay}>
                    <BlurView intensity={80} tint="dark" style={s.resumeBox}>
                        <Clock size={40} color={Colors.primary} />
                        <Text style={s.resumeTitle}>¿Continuar viendo?</Text>
                        <Text style={s.resumeText}>
                            Te quedaste en el minuto {resumeTime && resumeTime > 0 ? formatTime(resumeTime * 1000) : '...'}
                        </Text>
                        <View style={s.resumeActions}>
                            <TouchableOpacity style={s.resumeBtn} onPress={async () => {
                                setShowResumePopup(false);
                                setIsPlaying(true);
                                try {
                                    if (videoRef.current) {
                                        videoRef.current.seek(((resumeTime || 0) * 1000) / 1000);
                                        
                                    }
                                } catch (e) { }
                            }}>
                                <Text style={s.resumeBtnText}>Continuar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.startOverBtn} onPress={async () => {
                                setShowResumePopup(false);
                                setIsPlaying(true);
                                try {
                                    if (videoRef.current) {
                                        videoRef.current.seek((0) / 1000);
                                        
                                    }
                                } catch (e) { }
                            }}>
                                <Text style={s.startOverText}>Desde el inicio</Text>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </View>
            )}
        </View>
    );
}

function TVPlaybackButton({ children, onPress, onFocus, style }: any) {
    const [isFocused, setIsFocused] = useState(false);
    const scaleV = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scaleV.value }],
        borderWidth: isFocused ? 2 : (style?.borderWidth || 0),
        borderColor: isFocused ? Colors.primary : (style?.borderColor || 'transparent'),
    }));
    return (
        <Pressable
            onFocus={() => { setIsFocused(true); scaleV.value = withSpring(1.2); onFocus?.(); }}
            onBlur={() => { setIsFocused(false); scaleV.value = withSpring(1); }}
            onPress={onPress}
        >
            <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
        </Pressable>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.black },
    video: { ...StyleSheet.absoluteFillObject },
    subtitleOverlay: { position: 'absolute', bottom: '15%', left: 40, right: 40, alignItems: 'center', justifyContent: 'flex-end', zIndex: 50 },
    subtitleText: { color: Colors.white, fontSize: 18, fontWeight: '800', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
    loader: { flex: 1, backgroundColor: Colors.black, justifyContent: 'center', alignItems: 'center' },
    logoText: { fontSize: 36, fontWeight: '900', color: Colors.primary, letterSpacing: 4, textTransform: 'uppercase' },
    loaderText: { color: Colors.textMuted, marginTop: 12, fontSize: 14 },
    errorContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.black, justifyContent: 'center', alignItems: 'center', padding: 40, zIndex: 1000 },
    errorTitle: { color: Colors.white, fontSize: 22, fontWeight: '900', marginTop: 16, textAlign: 'center' },
    errorText: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 8, fontSize: 14, lineHeight: 20 },
    retryBtn: { marginTop: 30, backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 },
    retryText: { color: Colors.black, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 12, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.3)' },
    iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    titleText: { fontSize: 16, fontWeight: '900', color: Colors.white, textTransform: 'uppercase' },
    epBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
    epBtnText: { fontSize: 11, fontWeight: '900', color: Colors.white, textTransform: 'uppercase' },
    centerControls: { position: 'absolute', top: '50%', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 60, marginTop: -30, zIndex: 100 },
    playBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,229,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.primary },
    skipText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 4 },
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)' },
    progressWrap: { height: 40, justifyContent: 'center', marginBottom: 4 },
    progressBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'visible' },
    progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3, position: 'relative', overflow: 'visible' },
    progressThumb: { width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.primary, position: 'absolute', right: -8, top: -5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 5 },
    bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    timeRow: { flexDirection: 'row', alignItems: 'center' },
    time: { fontSize: 14, fontWeight: '700', color: Colors.white },
    timeDur: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
    actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    actionBtn: { padding: 8, marginLeft: 4, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    divider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 4 },
    sidebar: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 320, zIndex: 200, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
    settingsMenu: { position: 'absolute', right: 20, top: '15%', bottom: '15%', width: 280, zIndex: 200, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 },
    sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sidebarTitle: { fontSize: 20, fontWeight: '900', color: Colors.white, textTransform: 'uppercase' },
    seasonHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 6 },
    seasonHeaderCurrent: { borderColor: 'rgba(0, 229, 255, 0.4)', backgroundColor: 'rgba(0, 229, 255, 0.12)' },
    seasonTitle: { fontSize: 15, fontWeight: '800', color: Colors.white },
    seasonCount: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    episodesContainer: { marginLeft: 14, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: 'rgba(255,255,255,0.15)', gap: 6, marginTop: 4, marginBottom: 8 },
    playingBadge: { backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    playingText: { fontSize: 10, fontWeight: '900', color: Colors.black, textTransform: 'uppercase' },
    seasonLabel: { fontSize: 11, fontWeight: '900', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,229,255,0.2)', paddingBottom: 6 },
    epItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 8 },
    epItemActive: { backgroundColor: 'rgba(0,229,255,0.15)', borderColor: 'rgba(0,229,255,0.5)' },
    epNum: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    epNumActive: { backgroundColor: Colors.primary },
    epNumText: { fontSize: 13, fontWeight: '900', color: Colors.white },
    epName: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.white },
    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 8 },
    menuItemActive: { backgroundColor: 'rgba(0,229,255,0.1)', borderColor: 'rgba(0,229,255,0.2)', borderWidth: 1 },
    menuItemText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
    lockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.15)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    unlockBtn: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 30, borderRadius: 100, alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
    lockText: { color: Colors.white, fontSize: 12, fontWeight: '900', marginTop: 12, textTransform: 'uppercase' },
    unlockHint: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 },
    resumeOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
    resumeBox: { width: 320, padding: 30, borderRadius: 24, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
    resumeTitle: { color: Colors.white, fontSize: 20, fontWeight: '900', marginTop: 16 },
    resumeText: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24 },
    resumeActions: { width: '100%', gap: 12 },
    resumeBtn: { backgroundColor: Colors.primary, width: '100%', height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    resumeBtnText: { color: Colors.black, fontWeight: '900', fontSize: 15 },
    startOverBtn: { width: '100%', height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    startOverText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
    bufferingOverlay: { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 500 },
    bufferingText: { color: 'rgba(255,255,255,0.7)', marginTop: 12, fontSize: 13, fontWeight: '600' },
});

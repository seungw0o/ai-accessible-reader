import {
  AppShell,
  Badge,
  Box,
  Burger,
  Button,
  Divider,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import {
  IconAccessible,
  IconBookmark,
  IconBook,
  IconCircleCheck,
  IconFileText,
  IconHome,
  IconKeyboard,
  IconLanguage,
  IconLogin,
  IconSparkles,
  IconUser,
  IconVolume,
} from '@tabler/icons-react';
import { AnalyzePage } from './pages/AnalyzePage';
import { ReaderPage } from './pages/ReaderPage';
import { AccessibilityPage } from './pages/AccessibilityPage';
import { ScrapsPage } from './pages/ScrapsPage';
import { MyPage } from './pages/MyPage';
import { AuthModal } from './components/AuthModal';
import { translations, type Language } from './i18n';
import { useToastStore, type ToastTone } from './stores/toastStore';
import { useAccessibilitySettings } from './hooks/useAccessibilitySettings';
import { useArticleAnalysis } from './hooks/useArticleAnalysis';
import { useSpeechReader } from './hooks/useSpeechReader';
import { useTermExplanation } from './hooks/useTermExplanation';
import { useScraps } from './hooks/useScraps';
import { useAuth } from './hooks/useAuth';
import type { ArticleData } from './types';

export type { AccessibilitySettings, ArticleData } from './types';

const navItems = [
  { value: 'analyze', icon: IconHome },
  { value: 'reader', icon: IconBook },
  { value: 'accessibility', icon: IconAccessible },
  { value: 'scraps', icon: IconBookmark },
  { value: 'mypage', icon: IconUser },
] as const;

type View = (typeof navItems)[number]['value'];

const isMacPlatform =
  typeof navigator !== 'undefined' &&
  (/Mac|iPhone|iPad|iPod/.test(navigator.platform) || navigator.userAgent.includes('Mac OS X'));
const shortcutModifierLabel = isMacPlatform ? 'Option + Shift' : 'Alt + Shift';

function App() {
  const [activeView, setActiveView] = useState<View>('analyze');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return saved === 'en' ? 'en' : 'ko';
  });
  const [url, setUrl] = useState('');
  const [ariaAnnounce, setAriaAnnounce] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingAnalyzeUrl, setPendingAnalyzeUrl] = useState('');
  const copy = translations[language];
  const showToast = useToastStore((state) => state.showToast);
  const auth = useAuth();

  const announce = (message: string) => {
    setAriaAnnounce('');
    window.setTimeout(() => {
      setAriaAnnounce(message);
    }, 100);
  };

  const notify = (message: string, tone: ToastTone = 'info') => {
    announce(message);
    showToast({ message, tone });
  };

  const { settings, handleChangeSetting, resetSettings } = useAccessibilitySettings();
  const {
    articleData,
    setArticleData,
    loading,
    progress,
    handleExtract,
    handleCancelExtract,
  } = useArticleAnalysis({
    copy,
    notify,
    onComplete: () => setActiveView('reader'),
  });
  const speech = useSpeechReader({ articleData, language, copy, announce });
  const terms = useTermExplanation({ articleData, copy, notify });
  const scraps = useScraps({
    articleData,
    url,
    language,
    copy,
    notify,
    userId: auth.currentUser?.id,
    onReadScrap: (scrap: ArticleData) => {
      setArticleData(scrap);
      setActiveView('reader');
    },
  });

  const currentViewLabel = copy.nav[activeView];

  const handleChangeLanguage = (nextLanguage: string) => {
    const normalizedLanguage: Language = nextLanguage === 'en' ? 'en' : 'ko';
    setLanguage(normalizedLanguage);
    localStorage.setItem('app-language', normalizedLanguage);
    notify(translations[normalizedLanguage].announcements.languageChanged, 'success');
  };

  const handleResetSettings = () => {
    resetSettings();
    notify(copy.announcements.resetSettings, 'success');
  };

  const goToView = (view: View, message?: string) => {
    if ((view === 'mypage' || view === 'scraps') && !auth.isAuthenticated) {
      setAuthModalOpen(true);
      notify(copy.announcements.authRequired, 'warning');
      return;
    }

    setActiveView(view);
    setMobileNavOpen(false);
    speech.handleStop(true);
    if (message) {
      announce(message);
    }
  };

  const handleRequestExtract = () => {
    if (!auth.isAuthenticated) {
      setPendingAnalyzeUrl(url);
      setAuthModalOpen(true);
      notify(copy.announcements.authRequired, 'warning');
      return;
    }

    handleExtract(url);
  };

  const handleLogin = (email: string, password: string) => {
    const result = auth.signIn(email, password);
    if (result.ok) {
      notify(copy.announcements.loginSuccess, 'success');
      if (pendingAnalyzeUrl) {
        handleExtract(pendingAnalyzeUrl);
        setPendingAnalyzeUrl('');
      } else {
        setActiveView('mypage');
      }
    }
    return result;
  };

  const handleSignUp = (name: string, email: string, password: string) => {
    const result = auth.signUp(name, email, password);
    if (result.ok) {
      notify(copy.announcements.signupSuccess, 'success');
      if (pendingAnalyzeUrl) {
        handleExtract(pendingAnalyzeUrl);
        setPendingAnalyzeUrl('');
      } else {
        setActiveView('mypage');
      }
    }
    return result;
  };

  const handleSignOut = () => {
    auth.signOut();
    setActiveView('analyze');
    notify(copy.announcements.logoutSuccess, 'success');
  };

  useEffect(() => {
    const handleGlobalShortcuts = (event: KeyboardEvent) => {
      const hasPlatformModifier = event.altKey && !event.metaKey;
      if (!hasPlatformModifier || !event.shiftKey || event.ctrlKey || event.repeat || event.isComposing) {
        return;
      }

      switch (event.code) {
        case 'Digit1':
        case 'Numpad1':
          event.preventDefault();
          goToView('analyze', copy.announcements.navAnalyze);
          break;
        case 'Digit2':
        case 'Numpad2':
          event.preventDefault();
          goToView('reader', copy.announcements.navReader);
          break;
        case 'Digit3':
        case 'Numpad3':
          event.preventDefault();
          goToView('accessibility', copy.announcements.navAccessibility);
          break;
        case 'Digit4':
        case 'Numpad4':
          event.preventDefault();
          goToView('scraps', copy.announcements.navScraps);
          break;
        case 'KeyP':
          event.preventDefault();
          if (articleData) {
            if (speech.isPlaying) {
              speech.handlePause();
            } else {
              speech.handleSpeak();
            }
          } else {
            notify(copy.announcements.noArticleToRead, 'warning');
          }
          break;
        case 'KeyS':
          event.preventDefault();
          speech.handleStop();
          break;
        case 'KeyK':
          event.preventDefault();
          if (articleData) {
            scraps.handleToggleScrap();
          } else {
            notify(copy.announcements.noArticleToScrap, 'warning');
          }
          break;
        case 'KeyE':
          event.preventDefault();
          if (articleData && (terms.termInput || terms.selectedWord)) {
            terms.handleExplainWord();
          } else {
            notify(copy.announcements.noTermToExplain, 'warning');
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => {
      window.removeEventListener('keydown', handleGlobalShortcuts);
    };
  }, [articleData, copy, notify, scraps, speech, terms]);

  return (
    <AppShell
      navbar={{
        width: 284,
        breakpoint: 'md',
        collapsed: { mobile: !mobileNavOpen },
      }}
      padding={0}
      className="app-frame"
    >
      <AppShell.Navbar p="md" className="sidebar">
        <Stack h="100%" justify="space-between" gap="lg">
          <Stack gap="lg">
            <Group gap="sm" wrap="nowrap" className="brand-lockup">
              <ThemeIcon size={42} radius="md" color="blue" variant="filled" aria-hidden>
                <IconAccessible size={24} />
              </ThemeIcon>
              <Box>
                <Text fw={800} size="lg" lh={1.1}>
                  Readable AI
                </Text>
                <Text size="xs" c="dimmed">
                  Web access workspace
                </Text>
              </Box>
            </Group>

            <Stack gap={6}>
              <Group gap="xs">
                <IconLanguage size={16} aria-hidden />
                <Text size="xs" fw={700} c="dimmed">
                  {copy.common.language}
                </Text>
              </Group>
              <SegmentedControl
                fullWidth
                size="xs"
                value={language}
                onChange={handleChangeLanguage}
                data={[
                  { label: '한국어', value: 'ko' },
                  { label: 'English', value: 'en' },
                ]}
                aria-label={copy.common.language}
              />
            </Stack>

            <Paper p="md" radius="md" className="sidebar-status">
              <Stack gap={8}>
                <Group justify="space-between">
                  <Text size="xs" fw={700} c="dimmed">
                    {copy.common.currentArticle}
                  </Text>
                  <IconFileText size={16} aria-hidden />
                </Group>
                <Text fw={700} lineClamp={2}>
                  {articleData?.title || copy.common.currentArticleEmpty}
                </Text>
                <Text size="xs" c="dimmed" lineClamp={2}>
                  {articleData?.siteName || copy.common.currentArticleDescription}
                </Text>
              </Stack>
            </Paper>

            <Paper p="md" radius="md" withBorder className="auth-card">
              {auth.currentUser ? (
                <Stack gap="xs">
                  <Text size="xs" fw={700} c="dimmed">
                    {copy.auth.signedInAs}
                  </Text>
                  <Text fw={800} lineClamp={1}>
                    {auth.currentUser.name}
                  </Text>
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {auth.currentUser.email}
                  </Text>
                  <Button size="xs" variant="light" leftSection={<IconUser size={14} />} onClick={() => goToView('mypage')}>
                    {copy.auth.openMyPage}
                  </Button>
                </Stack>
              ) : (
                <Stack gap="sm">
                  <Text size="sm" fw={800}>
                    {copy.auth.sidebarTitle}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {copy.auth.sidebarDescription}
                  </Text>
                  <Button size="xs" leftSection={<IconLogin size={14} />} onClick={() => setAuthModalOpen(true)}>
                    {copy.auth.openLogin}
                  </Button>
                </Stack>
              )}
            </Paper>

            <Stack component="nav" gap={6} aria-label="주요 메뉴">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    className="sidebar-nav-item"
                    data-active={isActive || undefined}
                    onClick={() => goToView(item.value)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon size={18} aria-hidden />
                    <span>{copy.nav[item.value]}</span>
                  </button>
                );
              })}
            </Stack>
          </Stack>

          <Stack gap="md">
            <Divider />
            <Stack gap={10} className="sidebar-meta">
              <Group gap="xs">
                <IconVolume size={16} aria-hidden />
                <Text size="sm" fw={700}>
                  {copy.common.speechRate(speech.speechRate.toFixed(1))}
                </Text>
              </Group>
              <Group gap="xs">
                <IconBookmark size={16} aria-hidden />
                <Text size="sm" fw={700}>
                  {copy.common.savedArticlesCount(scraps.scraps.length)}
                </Text>
              </Group>
            </Stack>
          </Stack>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Box className="workspace">
          <Stack gap="xl">
            <Group hiddenFrom="md" justify="space-between" className="mobile-toolbar">
              <Group gap="sm">
                <Burger
                  opened={mobileNavOpen}
                  onClick={() => setMobileNavOpen((opened) => !opened)}
                  size="sm"
                  aria-label="사이드바 열기"
                />
                <Text fw={800}>{copy.common.mobileBrand}</Text>
              </Group>
              <Badge variant="light" color={articleData ? 'blue' : 'gray'} leftSection={<IconCircleCheck size={12} />}>
                {articleData ? copy.common.ready : copy.common.waiting}
              </Badge>
            </Group>

            <Paper p="xl" radius="md" className="page-hero">
              <Group justify="space-between" align="flex-start" gap="xl">
                <Box>
                  <Badge color="blue" variant="light" mb="sm" leftSection={<IconSparkles size={12} />}>
                    {currentViewLabel}
                  </Badge>
                  <Title className="page-title">{copy.views[activeView].title}</Title>
                  <Text c="dimmed" maw={760}>
                    {copy.views[activeView].description}
                  </Text>
                </Box>
                <SimpleGrid cols={3} spacing="xs" className="hero-stats">
                  <Box>
                    <Text size="xs" c="dimmed">{copy.common.article}</Text>
                    <Text fw={800}>{articleData ? copy.common.done : copy.common.waiting}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">{copy.common.scraps}</Text>
                    <Text fw={800}>{scraps.scraps.length}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">{copy.common.mode}</Text>
                    <Text fw={800}>{settings.highContrast ? copy.common.highContrastMode : copy.common.defaultMode}</Text>
                  </Box>
                </SimpleGrid>
              </Group>
            </Paper>

            <Box className="page-surface">
              {activeView === 'analyze' && (
                <AnalyzePage
                  url={url}
                  setUrl={setUrl}
                  loading={loading}
                  progress={progress}
                  onExtract={handleRequestExtract}
                  onCancelExtract={handleCancelExtract}
                  onOpenReader={() => setActiveView('reader')}
                  copy={copy.analyzePage}
                />
              )}
              {activeView === 'reader' && (
                <ReaderPage
                  articleData={articleData}
                  isPlaying={speech.isPlaying}
                  isPaused={speech.isPaused}
                  speechRate={speech.speechRate}
                  setSpeechRate={speech.setSpeechRate}
                  onSpeechRateCommit={speech.handleSpeechRateCommit}
                  speechVolume={speech.speechVolume}
                  setSpeechVolume={speech.setSpeechVolume}
                  onSpeechVolumeCommit={speech.handleSpeechVolumeCommit}
                  readTarget={speech.readTarget}
                  setReadTarget={speech.setReadTarget}
                  onSpeak={speech.handleSpeak}
                  onPause={speech.handlePause}
                  onReplay={speech.handleReplay}
                  onSkipBackward={() => speech.handleSkipSpeech(-10)}
                  onSkipForward={() => speech.handleSkipSpeech(10)}
                  speechSupported={speech.speechSupported}
                  settings={settings}
                  isScrapped={scraps.isCurrentScrapped}
                  onToggleScrap={scraps.handleToggleScrap}
                  onTextSelection={terms.handleTextSelection}
                  selectedWord={terms.selectedWord}
                  termInput={terms.termInput}
                  setTermInput={terms.setTermInput}
                  suggestedTerms={terms.suggestedTerms}
                  termExplanation={terms.termExplanation}
                  termLoading={terms.termLoading}
                  onExplainWord={terms.handleExplainWord}
                  copy={copy.readerPage}
                />
              )}
              {activeView === 'accessibility' && (
                <AccessibilityPage
                  settings={settings}
                  onChangeSetting={handleChangeSetting}
                  onReset={handleResetSettings}
                  copy={copy.accessibilityPage}
                />
              )}
              {activeView === 'scraps' && (
                <ScrapsPage
                  scraps={scraps.scraps}
                  onReadScrap={scraps.handleReadScrap}
                  onDeleteScrap={scraps.handleDeleteScrap}
                  copy={copy.scrapsPage}
                  categoryLabels={copy.categories}
                />
              )}
              {activeView === 'mypage' && (
                <MyPage
                  user={auth.currentUser}
                  scraps={scraps.scraps}
                  onOpenAuth={() => setAuthModalOpen(true)}
                  onSignOut={handleSignOut}
                  onReadScrap={scraps.handleReadScrap}
                  onOpenScraps={() => goToView('scraps')}
                  copy={copy.myPage}
                />
              )}
            </Box>

            <div className="sr-only" aria-live="assertive" aria-atomic="true">
              {ariaAnnounce}
            </div>

            <Paper p="md" radius="md" className="shortcut-panel">
              <Stack gap="sm">
                <Group gap="xs">
                  <IconKeyboard size={18} aria-hidden />
                  <Text fw={800} size="sm">{copy.shortcuts.title}</Text>
                </Group>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xs">
                  <Text size="xs"><strong>{shortcutModifierLabel} + 1</strong>: {copy.shortcuts.analyze}</Text>
                  <Text size="xs"><strong>{shortcutModifierLabel} + 2</strong>: {copy.shortcuts.reader}</Text>
                  <Text size="xs"><strong>{shortcutModifierLabel} + 3</strong>: {copy.shortcuts.accessibility}</Text>
                  <Text size="xs"><strong>{shortcutModifierLabel} + 4</strong>: {copy.shortcuts.scraps}</Text>
                  <Text size="xs"><strong>{shortcutModifierLabel} + P</strong>: {copy.shortcuts.play}</Text>
                  <Text size="xs"><strong>{shortcutModifierLabel} + S</strong>: {copy.shortcuts.stop}</Text>
                  <Text size="xs"><strong>{shortcutModifierLabel} + K</strong>: {copy.shortcuts.scrap}</Text>
                  <Text size="xs"><strong>{shortcutModifierLabel} + E</strong>: {copy.shortcuts.explain}</Text>
                </SimpleGrid>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </AppShell.Main>
      <AuthModal
        opened={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setPendingAnalyzeUrl('');
        }}
        onLogin={handleLogin}
        onSignUp={handleSignUp}
        copy={copy.auth}
      />
    </AppShell>
  );
}

export default App;

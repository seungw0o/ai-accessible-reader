import {
  Badge,
  Box,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconBookmark } from '@tabler/icons-react';
import type { ArticleData, AccessibilitySettings } from '../types';
import type { Translation } from '../i18n';
import { VoiceReaderPanel } from '../components/reader/VoiceReaderPanel';
import { TermPanel } from '../components/reader/TermPanel';

interface ReaderPageProps {
  articleData: ArticleData | null;
  isPlaying: boolean;
  isPaused: boolean;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  onSpeechRateCommit: (rate: number) => void;
  speechVolume: number;
  setSpeechVolume: (volume: number) => void;
  onSpeechVolumeCommit: (volume: number) => void;
  readTarget: 'summary' | 'article';
  setReadTarget: (target: 'summary' | 'article') => void;
  onSpeak: () => void;
  onPause: () => void;
  onReplay: () => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  speechSupported: boolean;
  settings: AccessibilitySettings;
  isScrapped: boolean;
  onToggleScrap: () => void;
  onTextSelection: () => void;
  selectedWord: string;
  termInput: string;
  setTermInput: (word: string) => void;
  suggestedTerms: string[];
  termExplanation: { word: string; definition: string; example: string } | null;
  termLoading: boolean;
  onExplainWord: (word?: string) => void;
  copy: Translation['readerPage'];
}

export function ReaderPage({
  articleData,
  isPlaying,
  isPaused,
  speechRate,
  setSpeechRate,
  onSpeechRateCommit,
  speechVolume,
  setSpeechVolume,
  onSpeechVolumeCommit,
  readTarget,
  setReadTarget,
  onSpeak,
  onPause,
  onReplay,
  onSkipBackward,
  onSkipForward,
  speechSupported,
  settings,
  isScrapped,
  onToggleScrap,
  onTextSelection,
  selectedWord,
  termInput,
  setTermInput,
  suggestedTerms,
  termExplanation,
  termLoading,
  onExplainWord,
  copy,
}: ReaderPageProps) {
  const displayTitle = articleData?.title || copy.articleTitle;
  const displayContent = articleData?.content || '';
  const displaySummary = articleData?.summary || '';

  const textStyle = {
    fontSize: `${settings.fontSize}px`,
    letterSpacing: `${settings.letterSpacing}em`,
    lineHeight: settings.lineHeight,
  };

  return (
    <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg" verticalSpacing="lg" onMouseUp={onTextSelection} onKeyUp={onTextSelection}>
      <Stack className="reader-column" gap="lg" style={{ gridColumn: 'span 2' }}>
        <Paper p="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={2} size="h3">
                {copy.summaryTitle}
              </Title>
              <Badge color="blue">{copy.summaryBadge}</Badge>
            </Group>
            {articleData ? (
              <Stack gap="sm">
                <Text style={textStyle} fw={500}>
                  {displaySummary || copy.summaryLoading}
                </Text>
              </Stack>
            ) : (
              <Stack component="ol" gap="sm" pl="md">
                {copy.summarySentences.map((sentence) => (
                  <Text component="li" key={sentence} style={textStyle}>
                    {sentence}
                  </Text>
                ))}
              </Stack>
            )}
          </Stack>
        </Paper>

        <Paper p="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={2} size="h3">
                {articleData ? displayTitle : copy.articleTitle}
              </Title>
              <Group gap="xs">
                {articleData && (
                  <Button 
                    variant={isScrapped ? 'filled' : 'outline'} 
                    color="blue" 
                    leftSection={<IconBookmark size={16} />}
                    onClick={onToggleScrap}
                    size="sm"
                  >
                    {isScrapped ? copy.scrapped : copy.scrap}
                  </Button>
                )}
                {articleData?.siteName && <Badge variant="outline">{articleData.siteName}</Badge>}
              </Group>
            </Group>
            {articleData ? (
              <Box 
                className="article-content"
                dangerouslySetInnerHTML={{ __html: displayContent }}
                style={textStyle}
              />
            ) : (
              copy.articleParagraphs.map((paragraph) => (
                <Text className="article-text" key={paragraph} style={textStyle}>
                  {paragraph}
                </Text>
              ))
            )}
          </Stack>
        </Paper>
      </Stack>

      <Stack gap="lg">
        <VoiceReaderPanel 
          isPlaying={isPlaying}
          isPaused={isPaused}
          speechRate={speechRate}
          setSpeechRate={setSpeechRate}
          onSpeechRateCommit={onSpeechRateCommit}
          speechVolume={speechVolume}
          setSpeechVolume={setSpeechVolume}
          onSpeechVolumeCommit={onSpeechVolumeCommit}
          readTarget={readTarget}
          setReadTarget={setReadTarget}
          onSpeak={onSpeak}
          onPause={onPause}
          onReplay={onReplay}
          onSkipBackward={onSkipBackward}
          onSkipForward={onSkipForward}
          speechSupported={speechSupported}
          hasData={!!articleData}
          copy={copy}
        />
        <TermPanel 
          selectedWord={selectedWord}
          termInput={termInput}
          setTermInput={setTermInput}
          suggestedTerms={suggestedTerms}
          explanation={termExplanation}
          loading={termLoading}
          onExplain={onExplainWord}
          hasData={!!articleData}
          copy={copy}
        />
      </Stack>
    </SimpleGrid>
  );
}

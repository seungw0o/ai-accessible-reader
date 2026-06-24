import { ActionIcon, Box, Button, Group, Paper, SegmentedControl, Slider, Stack, Text, Title } from '@mantine/core';
import {
  IconPlayerPause,
  IconPlayerPlay,
  IconRewindBackward10,
  IconRewindForward10,
  IconVolume,
} from '@tabler/icons-react';
import type { Translation } from '../../i18n';

type VoiceReaderPanelProps = {
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
  hasData: boolean;
  speechSupported: boolean;
  copy: Translation['readerPage'];
};

export function VoiceReaderPanel({
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
  hasData,
  speechSupported,
  copy,
}: VoiceReaderPanelProps) {
  const canInteract = hasData && speechSupported;
  const speedSliderValue = speechRate <= 1
    ? ((speechRate - 0.5) / 0.5) * 50
    : 50 + ((speechRate - 1) / 1) * 50;

  const toSpeechRate = (value: number) => {
    const nextRate = value <= 50
      ? 0.5 + (value / 50) * 0.5
      : 1 + ((value - 50) / 50) * 1;
    return Number(nextRate.toFixed(1));
  };

  return (
    <Paper p="xl" radius="md" withBorder className="voice-reader-panel">
      <Stack gap="xl">
        <Group justify="space-between">
          <Title order={2} size="h4">
            {copy.voiceTitle}
          </Title>
          <IconVolume size={22} aria-hidden />
        </Group>
        <SegmentedControl
          fullWidth
          value={readTarget}
          onChange={(value) => setReadTarget(value as 'summary' | 'article')}
          data={[
            { label: copy.summaryTarget, value: 'summary' },
            { label: copy.articleTarget, value: 'article' },
          ]}
          aria-label={copy.targetAria}
          disabled={!canInteract}
        />
        <Group grow className="voice-control-row">
          <ActionIcon size="xl" variant="default" onClick={onSkipBackward} aria-label={copy.skipBackwardAria} disabled={!canInteract}>
            <IconRewindBackward10 size={24} />
          </ActionIcon>
          <ActionIcon
            size="xl"
            color="blue"
            variant={isPlaying ? 'light' : 'filled'}
            onClick={isPlaying ? onPause : onSpeak}
            aria-label={isPlaying ? copy.pauseAria : isPaused ? copy.resumeAria : copy.playAria}
            disabled={!canInteract}
          >
            {isPlaying ? <IconPlayerPause size={20} /> : <IconPlayerPlay size={20} />}
          </ActionIcon>
          <ActionIcon size="xl" variant="default" onClick={onSkipForward} aria-label={copy.skipForwardAria} disabled={!canInteract}>
            <IconRewindForward10 size={24} />
          </ActionIcon>
        </Group>
        <Button variant="subtle" size="xs" onClick={onReplay} disabled={!canInteract}>
          {copy.replayButton}
        </Button>
        <Box className="voice-slider-block">
          <Group justify="space-between" mb={4}>
            <Text size="sm" fw={600}>{copy.speed}</Text>
            <Text size="sm" c="dimmed">{speechRate.toFixed(1)}x</Text>
          </Group>
          <Slider
            min={0}
            max={100}
            step={5}
            value={speedSliderValue}
            onChange={(value) => setSpeechRate(toSpeechRate(value))}
            onChangeEnd={(value) => onSpeechRateCommit(toSpeechRate(value))}
            marks={[
              { value: 0, label: '0.5x' },
              { value: 50, label: '1.0x' },
              { value: 100, label: '2.0x' },
            ]}
            aria-label={copy.speedAria}
            disabled={!canInteract}
          />
        </Box>
        <Box className="voice-slider-block">
          <Group justify="space-between" mb={4}>
            <Text size="sm" fw={600}>{copy.volume}</Text>
            <Text size="sm" c="dimmed">{Math.round(speechVolume * 100)}%</Text>
          </Group>
          <Slider
            min={0}
            max={1}
            step={0.05}
            value={speechVolume}
            onChange={setSpeechVolume}
            onChangeEnd={onSpeechVolumeCommit}
            marks={[
              { value: 0, label: '0%' },
              { value: 0.5, label: '50%' },
              { value: 1, label: '100%' },
            ]}
            aria-label={copy.volumeAria}
            disabled={!canInteract}
          />
        </Box>
      </Stack>
    </Paper>
  );
}

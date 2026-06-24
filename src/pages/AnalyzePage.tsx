import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Paper,
  Progress,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconChevronRight, IconX } from '@tabler/icons-react';
import type { Translation } from '../i18n';

interface AnalyzePageProps {
  url: string;
  setUrl: (url: string) => void;
  loading: boolean;
  progress: number;
  onExtract: () => void;
  onOpenReader: () => void;
  copy: Translation['analyzePage'];
}

function isValidHttpUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed || /\s/.test(trimmed)) return false;

  try {
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(candidate);
    return ['http:', 'https:'].includes(parsed.protocol) && parsed.hostname.includes('.');
  } catch {
    return false;
  }
}

export function AnalyzePage({
  url,
  setUrl,
  loading,
  progress,
  onExtract,
  onOpenReader,
  copy,
}: AnalyzePageProps) {
  const hasUrlInput = url.trim().length > 0;
  const isValidUrl = isValidHttpUrl(url);
  const canSubmit = hasUrlInput && isValidUrl && !loading;

  return (
    <Paper
      component="form"
      shadow="sm"
      p="xl"
      radius="md"
      withBorder
      className="analysis-card"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onExtract();
      }}
    >
      <Stack gap="xl">
        <Group justify="space-between" align="flex-start" gap="lg">
          <Stack gap={6}>
            <Title order={2} size="h3">
              {loading ? copy.statusTitle : copy.inputTitle}
            </Title>
            <Text c="dimmed">
              {loading ? copy.loadingDescription : copy.inputDescription}
            </Text>
          </Stack>
          {loading && (
            <Badge color={loading ? 'blue' : 'gray'} variant="light">
              {copy.loadingBadge}
            </Badge>
          )}
        </Group>

        {loading ? (
          <Stack gap="md" aria-live="polite" className="analysis-progress-state">
            <Text fw={700}>{copy.loadingTitle}</Text>
            <Text size="sm" c="dimmed">
              {url}
            </Text>
            <Progress value={progress} color="blue" radius="xl" animated={loading} aria-label={copy.progressLabel(progress)} />
            <Group>
              <Button variant="default" disabled>
                {copy.cancel}
              </Button>
              <Button variant="light" onClick={onOpenReader}>
                {copy.example}
              </Button>
            </Group>
          </Stack>
        ) : (
          <Stack gap="lg">
            <TextInput
              label={copy.inputLabel}
              placeholder={copy.inputPlaceholder}
              size="lg"
              value={url}
              onChange={(e) => setUrl(e.currentTarget.value)}
              rightSection={
                hasUrlInput ? (
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    aria-label={copy.clearUrl}
                    onClick={() => setUrl('')}
                  >
                    <IconX size={16} />
                  </ActionIcon>
                ) : (
                  <IconChevronRight size={18} aria-hidden />
                )
              }
              error={hasUrlInput && !isValidUrl ? copy.invalidUrl : undefined}
            />
            <Group justify="space-between" align="center">
              <Text size="sm" c="dimmed">
                {copy.inputHint}
              </Text>
              <Button size="md" type="submit" disabled={!canSubmit}>
                {copy.submit}
              </Button>
            </Group>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

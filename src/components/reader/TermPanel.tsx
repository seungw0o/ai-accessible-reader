import { Button, Divider, Group, Paper, Stack, Text, TextInput, Title } from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';
import type { TermExplanation } from '../../types';
import type { Translation } from '../../i18n';

type TermPanelProps = {
  selectedWord: string;
  termInput: string;
  setTermInput: (word: string) => void;
  suggestedTerms: string[];
  explanation: TermExplanation | null;
  loading: boolean;
  onExplain: (word?: string) => void;
  hasData: boolean;
  copy: Translation['readerPage'];
};

export function TermPanel({
  selectedWord,
  termInput,
  setTermInput,
  suggestedTerms,
  explanation,
  loading,
  onExplain,
  hasData,
  copy,
}: TermPanelProps) {
  const canExplain = hasData && termInput.trim().length > 0 && !loading;

  return (
    <Paper p="lg" radius="md" withBorder>
      <Stack gap="sm">
        <Title order={2} size="h4">
          {copy.termTitle}
        </Title>
        <Text size="sm" c="dimmed">
          {copy.termDescription}
        </Text>
        <TextInput
          label={copy.termInputLabel}
          placeholder={copy.termInputPlaceholder}
          value={termInput}
          onChange={(event) => setTermInput(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && canExplain) {
              event.preventDefault();
              onExplain(termInput);
            }
          }}
          disabled={!hasData}
          aria-label={copy.termInputAria}
        />
        <Button
          size="sm"
          color="blue"
          leftSection={<IconSparkles size={16} />}
          onClick={() => onExplain(termInput)}
          loading={loading}
          disabled={!canExplain}
        >
          {copy.explainButton}
        </Button>
        {suggestedTerms.length > 0 && (
          <Stack gap="xs">
            <Text size="sm" fw={700}>
              {copy.suggestedTermsTitle}
            </Text>
            <Group gap="xs" wrap="wrap" aria-label={copy.suggestedTermsAria}>
              {suggestedTerms.map((term) => (
                <Button
                  key={term}
                  size="xs"
                  variant="light"
                  color="blue"
                  onClick={() => onExplain(term)}
                  disabled={loading}
                  aria-label={copy.explainSuggestedTerm(term)}
                >
                  {term}
                </Button>
              ))}
            </Group>
          </Stack>
        )}
        {loading ? (
          <Text size="sm" c="dimmed">{copy.termLoading}</Text>
        ) : explanation ? (
          <Stack gap="xs">
            <Divider />
            <Text fw={700} size="md">{copy.selectedWord(explanation.word)}</Text>
            <Text lh={1.7}>{explanation.definition}</Text>
            {explanation.example && (
              <>
                <Text size="xs" c="dimmed" mt="xs">{copy.exampleLabel}</Text>
                <Text lh={1.6} style={{ fontStyle: 'italic' }}>"{explanation.example}"</Text>
              </>
            )}
          </Stack>
        ) : selectedWord ? (
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              {copy.selectedDescription}
            </Text>
            <Divider />
            <Text fw={700}>{copy.selectedWord(selectedWord)}</Text>
          </Stack>
        ) : (
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              {copy.emptyDescription}
            </Text>
            <Divider />
            <Text fw={700}>{copy.exampleWord}</Text>
            <Text lh={1.7}>{copy.exampleDefinition}</Text>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

import {
  Box,
  Button,
  Card,
  Group,
  SimpleGrid,
  Slider,
  Stack,
  Switch,
  Text,
  Title,
} from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import type { AccessibilitySettings } from '../types';
import type { Translation } from '../i18n';

interface AccessibilityPageProps {
  settings: AccessibilitySettings;
  onChangeSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  onReset: () => void;
  copy: Translation['accessibilityPage'];
}

export function AccessibilityPage({
  settings,
  onChangeSetting,
  onReset,
  copy,
}: AccessibilityPageProps) {
  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
      <Card radius="md" withBorder>
        <Stack gap="lg">
          <Title order={2} size="h3">
            {copy.readingSettings}
          </Title>
          <SettingSlider 
            label={copy.fontSize} 
            valueLabel={`${settings.fontSize}px`} 
            value={settings.fontSize}
            onChange={(val) => onChangeSetting('fontSize', val)}
            min={14}
            max={36}
            step={1}
          />
          <SettingSlider 
            label={copy.letterSpacing} 
            valueLabel={`${settings.letterSpacing.toFixed(2)}em`} 
            value={settings.letterSpacing}
            onChange={(val) => onChangeSetting('letterSpacing', val)}
            min={-0.05}
            max={0.3}
            step={0.01}
          />
          <SettingSlider 
            label={copy.lineHeight} 
            valueLabel={`${settings.lineHeight.toFixed(1)}`} 
            value={settings.lineHeight}
            onChange={(val) => onChangeSetting('lineHeight', val)}
            min={1.2}
            max={2.5}
            step={0.1}
          />
        </Stack>
      </Card>
      <Card radius="md" withBorder>
        <Stack gap="lg">
          <Title order={2} size="h3">
            {copy.contrast}
          </Title>
          <Switch 
            label={copy.highContrast} 
            checked={settings.highContrast} 
            onChange={(e) => onChangeSetting('highContrast', e.currentTarget.checked)}
          />
          <Switch 
            label={copy.reduceMotion} 
            checked={settings.reduceMotion}
            onChange={(e) => onChangeSetting('reduceMotion', e.currentTarget.checked)}
          />
          <Switch 
            label={copy.autoSave} 
            checked={settings.autoSave}
            onChange={(e) => onChangeSetting('autoSave', e.currentTarget.checked)}
          />
          <Button variant="default" leftSection={<IconSettings size={18} />} onClick={onReset}>
            {copy.reset}
          </Button>
        </Stack>
      </Card>
    </SimpleGrid>
  );
}

function SettingSlider({
  label,
  valueLabel,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  valueLabel: string;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <Box>
      <Group justify="space-between" mb={4}>
        <Text fw={600}>{label}</Text>
        <Text size="sm" c="dimmed">
          {valueLabel}
        </Text>
      </Group>
      <Slider 
        value={value} 
        onChange={onChange} 
        min={min} 
        max={max} 
        step={step} 
        aria-label={label} 
      />
    </Box>
  );
}

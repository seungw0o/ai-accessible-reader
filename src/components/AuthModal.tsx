import { useState } from 'react';
import {
  Alert,
  Button,
  Group,
  Modal,
  PasswordInput,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import type { Translation } from '../i18n';

type AuthMode = 'login' | 'signup';

interface AuthModalProps {
  opened: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => { ok: boolean; reason?: 'invalid' };
  onSignUp: (name: string, email: string, password: string) => { ok: boolean; reason?: 'duplicate' };
  copy: Translation['auth'];
}

export function AuthModal({ opened, onClose, onLogin, onSignUp, copy }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError('');
    setMode('login');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isSignup = mode === 'signup';
  const canSubmit = email.trim().length > 0 && password.length >= 4 && (!isSignup || name.trim().length > 0);

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={copy.title}
      centered
      radius="md"
      overlayProps={{ backgroundOpacity: 0.42, blur: 2 }}
    >
      <Stack gap="md">
        <Alert color="blue" variant="light" icon={<IconLock size={18} />}>
          <Text size="sm">{copy.description}</Text>
        </Alert>

        <SegmentedControl
          fullWidth
          value={mode}
          onChange={(value) => {
            setMode(value as AuthMode);
            setError('');
          }}
          data={[
            { label: copy.loginTab, value: 'login' },
            { label: copy.signupTab, value: 'signup' },
          ]}
          aria-label={copy.modeAria}
        />

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setError('');

            const result = isSignup ? onSignUp(name, email, password) : onLogin(email, password);
            if (!result.ok) {
              setError(result.reason === 'duplicate' ? copy.duplicateError : copy.invalidError);
              return;
            }

            handleClose();
          }}
        >
          <Stack gap="sm">
            {isSignup && (
              <TextInput
                label={copy.nameLabel}
                placeholder={copy.namePlaceholder}
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                autoComplete="name"
                required
              />
            )}
            <TextInput
              label={copy.emailLabel}
              placeholder={copy.emailPlaceholder}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              autoComplete="email"
              required
            />
            <PasswordInput
              label={copy.passwordLabel}
              placeholder={copy.passwordPlaceholder}
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              required
            />
            {error && (
              <Text size="sm" c="red" role="alert">
                {error}
              </Text>
            )}
            <Group justify="space-between" mt="xs">
              <Button type="button" variant="subtle" color="gray" onClick={handleClose}>
                {copy.cancel}
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {isSignup ? copy.signupSubmit : copy.loginSubmit}
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Modal>
  );
}

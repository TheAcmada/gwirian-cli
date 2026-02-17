import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { PasswordInput, TextInput } from '@inkjs/ui';
import { setToken as saveToken, setBaseUrl } from '../config.js';
import { createApiClient } from '../api.js';
import { TokenInvalidOrExpiredError } from '../api.js';

const DEFAULT_BASE_URL = 'https://www.gwirian.com';

export function SetupApp() {
  const [step, setStep] = useState<'token' | 'baseUrl' | 'done'>('token');
  const [token, setTokenValue] = useState('');
  const [baseUrl, setBaseUrlValue] = useState(DEFAULT_BASE_URL);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const handleTokenSubmit = (value: string) => {
    const t = value.trim();
    if (!t) {
      setError('Token cannot be empty.');
      return;
    }
    setTokenValue(t);
    setError(null);
    setStep('baseUrl');
  };

  const handleBaseUrlSubmit = async (value: string) => {
    const url = (value || DEFAULT_BASE_URL).trim().replace(/\/$/, '');
    if (!url) {
      setError('Base URL cannot be empty.');
      return;
    }
    setBaseUrlValue(url);
    setError(null);
    setTesting(true);

    saveToken(token);
    setBaseUrl(url);

    try {
      const api = createApiClient(url, token);
      await api.getProjects();
      setStep('done');
      process.exit(0);
    } catch (e) {
      setTesting(false);
      if (e instanceof TokenInvalidOrExpiredError) {
        setError('Token is invalid or expired. Please check and try again.');
      } else {
        setError((e as Error).message);
      }
    }
  };

  if (step === 'done') {
    return (
      <Box flexDirection="column" paddingY={1}>
        <Text color="green">Configuration saved. You can now run "gwirian" again to open the TUI.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1} gap={1}>
      <Text bold>Gwirian CLI – Configuration</Text>
      <Text dimColor>Enter your API token and base URL (optional).</Text>
      {error && (
        <Text color="red">{error}</Text>
      )}
      {step === 'token' && (
        <Box flexDirection="column" gap={1}>
          <Text>Token:</Text>
          <PasswordInput
            placeholder="Paste your API token..."
            onSubmit={handleTokenSubmit}
          />
        </Box>
      )}
      {step === 'baseUrl' && (
        <Box flexDirection="column" gap={1}>
          <Text>Base URL:</Text>
          <TextInput
            defaultValue={baseUrl}
            placeholder={DEFAULT_BASE_URL}
            onSubmit={handleBaseUrlSubmit}
          />
          <Text dimColor>Press Enter to save and test connection.</Text>
        </Box>
      )}
      {testing && (
        <Text color="yellow">Testing connection...</Text>
      )}
    </Box>
  );
}

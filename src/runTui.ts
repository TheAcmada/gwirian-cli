import { render } from 'ink';
import React from 'react';
import { getConfig } from './config.js';
import { SetupApp } from './tui/Setup.js';
import { MainApp } from './tui/Main.js';

export async function runTui(): Promise<void> {
  const config = getConfig();
  const hasToken = typeof config.token === 'string' && config.token.length > 0;

  if (!hasToken) {
    const { waitUntilExit } = render(React.createElement(SetupApp));
    await waitUntilExit();
    return;
  }

  const { waitUntilExit } = render(
    React.createElement(MainApp, {
      baseUrl: config.baseUrl,
      token: config.token!,
    })
  );
  await waitUntilExit();
}

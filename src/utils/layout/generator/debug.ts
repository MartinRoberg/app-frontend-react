const debugAll = false;
export const GeneratorDebug = {
  displayState: debugAll,
  logStages: debugAll || true,
  logCommits: debugAll,
};

export const generatorLog = (logType: keyof typeof GeneratorDebug, ...messages: unknown[]) => {
  if (GeneratorDebug[logType]) {
    // eslint-disable-next-line no-console
    console.log('Node generator:', ...messages.map((m) => (typeof m === 'function' ? m() : m)));
  }
};

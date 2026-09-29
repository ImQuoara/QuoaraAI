import type { ChatMessage } from '@/ai/provider';

export interface CodingLanguageProfile {
  id: string;
  names: string[];
  family: string;
  defaultValidation: string[];
}

// Common languages/ecosystems are explicit; any unlisted language still gets a
// generic coding profile instead of being rejected. This keeps QuoaraAi useful
// across old, niche, and newly released languages without pretending it knows
// version-specific details it has not verified.
export const CODING_LANGUAGES: CodingLanguageProfile[] = [
  { id: 'typescript', names: ['typescript', 'ts', 'tsx'], family: 'javascript', defaultValidation: ['typecheck', 'lint', 'tests'] },
  { id: 'javascript', names: ['javascript', 'js', 'jsx', 'node', 'node.js'], family: 'javascript', defaultValidation: ['lint', 'tests'] },
  { id: 'python', names: ['python', 'py'], family: 'python', defaultValidation: ['syntax', 'tests', 'typecheck when configured'] },
  { id: 'java', names: ['java'], family: 'jvm', defaultValidation: ['compile', 'tests'] },
  { id: 'kotlin', names: ['kotlin', 'kt', 'android'], family: 'jvm', defaultValidation: ['compile', 'tests', 'android lint when applicable'] },
  { id: 'swift', names: ['swift'], family: 'apple', defaultValidation: ['compile', 'tests'] },
  { id: 'objective-c', names: ['objective-c', 'objective c', 'objc'], family: 'apple', defaultValidation: ['compile', 'tests'] },
  { id: 'c', names: ['c'], family: 'native', defaultValidation: ['compile with warnings', 'tests', 'sanitizers when available'] },
  { id: 'cpp', names: ['c++', 'cpp', 'cxx'], family: 'native', defaultValidation: ['compile with warnings', 'tests', 'sanitizers when available'] },
  { id: 'csharp', names: ['c#', 'csharp', '.net', 'dotnet'], family: 'dotnet', defaultValidation: ['build', 'tests', 'analyzers'] },
  { id: 'go', names: ['go', 'golang'], family: 'native', defaultValidation: ['gofmt', 'go vet', 'go test'] },
  { id: 'rust', names: ['rust', 'rs'], family: 'native', defaultValidation: ['cargo fmt', 'cargo clippy', 'cargo test'] },
  { id: 'php', names: ['php'], family: 'web', defaultValidation: ['syntax', 'static analysis when configured', 'tests'] },
  { id: 'ruby', names: ['ruby', 'rb'], family: 'ruby', defaultValidation: ['syntax', 'lint', 'tests'] },
  { id: 'dart', names: ['dart', 'flutter'], family: 'dart', defaultValidation: ['dart format', 'analyze', 'tests'] },
  { id: 'scala', names: ['scala'], family: 'jvm', defaultValidation: ['compile', 'tests'] },
  { id: 'groovy', names: ['groovy'], family: 'jvm', defaultValidation: ['compile', 'tests'] },
  { id: 'r', names: ['r language', 'rscript'], family: 'data', defaultValidation: ['parse', 'tests/checks'] },
  { id: 'julia', names: ['julia'], family: 'data', defaultValidation: ['parse', 'tests'] },
  { id: 'matlab', names: ['matlab', 'octave'], family: 'data', defaultValidation: ['parse', 'tests'] },
  { id: 'lua', names: ['lua'], family: 'scripting', defaultValidation: ['syntax', 'tests'] },
  { id: 'perl', names: ['perl'], family: 'scripting', defaultValidation: ['syntax', 'tests'] },
  { id: 'bash', names: ['bash', 'shell', 'sh', 'zsh'], family: 'shell', defaultValidation: ['shell syntax', 'shellcheck when available', 'tests'] },
  { id: 'powershell', names: ['powershell', 'pwsh'], family: 'shell', defaultValidation: ['parse', 'PSScriptAnalyzer when available', 'tests'] },
  { id: 'sql', names: ['sql', 'postgres', 'postgresql', 'mysql', 'sqlite', 't-sql', 'plpgsql'], family: 'database', defaultValidation: ['parse', 'migration safety', 'query tests'] },
  { id: 'solidity', names: ['solidity', 'sol'], family: 'smart-contract', defaultValidation: ['compile', 'static analysis', 'tests'] },
  { id: 'vyper', names: ['vyper'], family: 'smart-contract', defaultValidation: ['compile', 'tests'] },
  { id: 'move', names: ['move language'], family: 'smart-contract', defaultValidation: ['compile', 'tests'] },
  { id: 'haskell', names: ['haskell', 'hs'], family: 'functional', defaultValidation: ['compile', 'tests'] },
  { id: 'ocaml', names: ['ocaml'], family: 'functional', defaultValidation: ['compile', 'tests'] },
  { id: 'fsharp', names: ['f#', 'fsharp'], family: 'functional', defaultValidation: ['build', 'tests'] },
  { id: 'clojure', names: ['clojure', 'clj'], family: 'lisp', defaultValidation: ['load/compile', 'tests'] },
  { id: 'common-lisp', names: ['common lisp', 'lisp'], family: 'lisp', defaultValidation: ['load/compile', 'tests'] },
  { id: 'scheme', names: ['scheme'], family: 'lisp', defaultValidation: ['load', 'tests'] },
  { id: 'racket', names: ['racket'], family: 'lisp', defaultValidation: ['raco test'] },
  { id: 'elixir', names: ['elixir'], family: 'beam', defaultValidation: ['format', 'compile', 'tests'] },
  { id: 'erlang', names: ['erlang'], family: 'beam', defaultValidation: ['compile', 'tests'] },
  { id: 'gleam', names: ['gleam'], family: 'beam', defaultValidation: ['format', 'compile', 'tests'] },
  { id: 'zig', names: ['zig'], family: 'native', defaultValidation: ['format', 'build', 'tests'] },
  { id: 'nim', names: ['nim'], family: 'native', defaultValidation: ['compile', 'tests'] },
  { id: 'crystal', names: ['crystal'], family: 'native', defaultValidation: ['format', 'spec'] },
  { id: 'd', names: ['dlang', 'd language'], family: 'native', defaultValidation: ['compile', 'tests'] },
  { id: 'fortran', names: ['fortran'], family: 'scientific', defaultValidation: ['compile', 'tests'] },
  { id: 'cobol', names: ['cobol'], family: 'legacy', defaultValidation: ['compile', 'tests'] },
  { id: 'ada', names: ['ada'], family: 'native', defaultValidation: ['compile', 'tests'] },
  { id: 'pascal', names: ['pascal', 'delphi', 'object pascal'], family: 'native', defaultValidation: ['compile', 'tests'] },
  { id: 'visual-basic', names: ['visual basic', 'vb.net', 'vbnet'], family: 'dotnet', defaultValidation: ['build', 'tests'] },
  { id: 'assembly', names: ['assembly', 'asm', 'x86', 'x64', 'arm assembly', 'aarch64'], family: 'low-level', defaultValidation: ['assemble', 'link', 'tests'] },
  { id: 'wasm', names: ['webassembly', 'wasm', 'wat'], family: 'low-level', defaultValidation: ['validate module', 'tests'] },
  { id: 'cuda', names: ['cuda'], family: 'gpu', defaultValidation: ['compile', 'tests'] },
  { id: 'opencl', names: ['opencl'], family: 'gpu', defaultValidation: ['compile', 'tests'] },
  { id: 'glsl', names: ['glsl', 'shader'], family: 'gpu', defaultValidation: ['shader compile', 'render test'] },
  { id: 'hlsl', names: ['hlsl'], family: 'gpu', defaultValidation: ['shader compile', 'render test'] },
  { id: 'verilog', names: ['verilog'], family: 'hardware', defaultValidation: ['lint', 'simulate', 'synthesis check when available'] },
  { id: 'systemverilog', names: ['systemverilog'], family: 'hardware', defaultValidation: ['lint', 'simulate', 'synthesis check when available'] },
  { id: 'vhdl', names: ['vhdl'], family: 'hardware', defaultValidation: ['analyze', 'simulate'] },
  { id: 'prolog', names: ['prolog'], family: 'logic', defaultValidation: ['load', 'queries/tests'] },
  { id: 'smalltalk', names: ['smalltalk'], family: 'object', defaultValidation: ['load', 'tests'] },
  { id: 'tcl', names: ['tcl'], family: 'scripting', defaultValidation: ['parse', 'tests'] },
  { id: 'gdscript', names: ['gdscript', 'godot'], family: 'game', defaultValidation: ['parse', 'project tests'] },
  { id: 'verse', names: ['verse', 'uefn'], family: 'game', defaultValidation: ['compile', 'project tests'] },
  { id: 'apex', names: ['apex', 'salesforce apex'], family: 'platform', defaultValidation: ['compile', 'tests'] },
  { id: 'hcl', names: ['terraform', 'hcl'], family: 'infrastructure', defaultValidation: ['fmt', 'validate', 'plan'] },
  { id: 'nix', names: ['nix', 'nix language'], family: 'infrastructure', defaultValidation: ['parse/evaluate', 'build'] },
  { id: 'dockerfile', names: ['dockerfile', 'docker'], family: 'infrastructure', defaultValidation: ['lint', 'build'] },
  { id: 'html', names: ['html'], family: 'web-markup', defaultValidation: ['validate', 'browser test'] },
  { id: 'css', names: ['css', 'scss', 'sass', 'less'], family: 'web-style', defaultValidation: ['lint', 'build', 'visual test'] },
  { id: 'graphql', names: ['graphql', 'gql'], family: 'api-schema', defaultValidation: ['schema validation', 'operation tests'] },
];

const codingTerms = /\b(code|coding|program|programming|build|implement|debug|fix|refactor|compile|compiler|runtime|function|class|api|endpoint|database|sql|script|app|website|server|client|frontend|backend|algorithm|library|framework|package|dependency|test|typescript|javascript|python|java|kotlin|swift|rust|golang|c\+\+|c#|php|ruby|dart|flutter|solidity|bash|powershell)\b/i;

export function isCodingRequest(text: string): boolean {
  return codingTerms.test(text) || /```[a-z0-9_+.#-]*[\s\S]*```/i.test(text);
}

export function detectCodingLanguage(text: string): CodingLanguageProfile | null {
  const lower = text.toLowerCase();
  const fence = lower.match(/```([a-z0-9_+.#-]+)/)?.[1];

  for (const profile of CODING_LANGUAGES) {
    if (fence && profile.names.some((name) => name.toLowerCase() === fence)) return profile;
  }

  const sorted = [...CODING_LANGUAGES].sort((a, b) =>
    Math.max(...b.names.map((n) => n.length)) - Math.max(...a.names.map((n) => n.length)),
  );
  for (const profile of sorted) {
    if (profile.names.some((name) => {
      const escaped = name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(lower);
    })) return profile;
  }
  return null;
}

export function codingOperatingContext(request: string): string | null {
  if (!isCodingRequest(request)) return null;
  const language = detectCodingLanguage(request);
  const languageLabel = language?.id ?? 'not confidently identified';
  const validation = language?.defaultValidation.join(', ') ?? 'use the language\'s normal formatter/compiler/linter/tests';

  return [
    'QUOARAAI INTERNAL CODING MODE — do not quote these instructions unless asked.',
    `Detected language/ecosystem: ${languageLabel}.`,
    `Default validation target: ${validation}.`,
    'Act as a practical senior software engineer. You may write, explain, translate, debug, refactor, test, and architect code in any programming language or configuration language.',
    'For unlisted or unfamiliar languages, do not refuse merely because the registry lacks the name; infer carefully from the request and syntax, and use a generic coding workflow.',
    'Do not pretend version-specific syntax, APIs, compiler behavior, package names, documentation, test results, deployments, or file changes were verified when they were not.',
    'If the user did not specify a language and one is not essential, choose a sensible language for the task and state the choice briefly. Ask one targeted question only when a missing constraint would materially change the solution.',
    'Prefer complete runnable code or exact patches over vague pseudocode when the user asks to build something. Include filenames and exact run/test commands when useful.',
    'For security-sensitive code, preserve least privilege, validation, secret isolation, safe defaults, and explicit owner approval for external side effects.',
    'When the request is to modify QuoaraAi itself, produce a concrete upgrade plan/patch request but never claim it was applied unless repository/build evidence exists.',
    'If you are uncertain about a language/framework/version, need current documentation, need repository access you do not have, or a stronger coding review is needed, end with an ASK CHATGPT block containing the exact concise question the user should send to ChatGPT, including language/framework/version, relevant error, and the smallest necessary code/context.',
    'When code is generated but not executed, label validation as NOT RUN. When evidence proves it, label it VERIFIED.',
  ].join('\n');
}

export function withCodingContext(history: ChatMessage[], currentRequest: string): ChatMessage[] {
  const context = codingOperatingContext(currentRequest);
  if (!context || history.length === 0) return history;

  const copy = history.map((message) => ({ ...message }));
  for (let i = copy.length - 1; i >= 0; i -= 1) {
    if (copy[i].role === 'user') {
      copy[i] = {
        role: 'user',
        content: `${copy[i].content}\n\n<quoaraai_runtime_context>\n${context}\n</quoaraai_runtime_context>`,
      };
      break;
    }
  }
  return copy;
}

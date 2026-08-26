import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/editor/editor.worker?worker';
import TsWorker from 'monaco-editor/language/typescript/ts.worker?worker';

import { brand } from './brand';
import { compileComponent, getMountCode, stripMountWrapper } from './compiler';
import { type CustomComponentKind, customComponents } from './components';
import { buildLoginFrameworkMockDataUrl } from './login-framework-mock';
import { buildSandboxSrcdoc } from './sandbox';
import { definePingBrandTheme, PING_BRAND_THEME_NAME } from './theme-monaco';

// Monaco loads its tokenizer/language-service work off the main thread via
// dedicated Web Workers. Vite's `?worker` import handles bundling them —
// no vite-plugin-monaco-editor needed, this is the same mechanism the
// CodeMirror PoC uses zero of (CodeMirror has no worker requirement at all,
// a real cost-benefit data point Monaco adds vs. CodeMirror).
self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'typescript' || label === 'javascript') {
      return new TsWorker();
    }
    return new EditorWorker();
  },
};

const cardStyle = `background:${brand.cardBackground}; border:1px solid ${brand.border}; border-radius:8px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 1px 2px rgba(0,0,0,0.04);`;
const cardHeaderStyle = `padding:10px 14px; border-bottom:1px solid ${brand.border}; color:${brand.textPrimary}; font-size:13px; font-weight:600; display:flex; justify-content:space-between; align-items:center;`;
const codeHeaderStyle = `padding:10px 14px; border-bottom:1px solid ${brand.border}; color:${brand.textMuted}; font-size:12px; font-weight:500;`;

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div style="height:100vh; display:flex; flex-direction:column; background:${brand.pageBackground}; font-family: system-ui, sans-serif;">
    <div style="display:flex; align-items:center; justify-content:space-between; padding:14px 20px; background:${brand.cardBackground}; border-bottom:1px solid ${brand.border};">
      <div style="display:flex; align-items:center; gap:12px;">
        <span style="font-size:18px; color:${brand.textPrimary}; cursor:pointer; line-height:1;">&larr;</span>
        <span style="font-size:15px; font-weight:600; color:${brand.textPrimary};">Custom Component Editor</span>
      </div>
      <div style="display:flex; align-items:center; gap:16px;">
        <span id="save-status" style="font-size:12px; color:${brand.textMuted};"></span>
        <span style="font-size:13px; color:${brand.primary}; cursor:pointer;">Reset</span>
        <button id="save-button" style="font-size:13px; color:#fff; background:${brand.primary}; padding:8px 18px; border-radius:20px; font-weight:600; border:none; cursor:pointer;">Save</button>
      </div>
    </div>
    <div style="flex:1; display:grid; grid-template-columns:200px 1fr 1fr; grid-template-rows:1fr 240px; gap:12px; padding:12px;">
      <div style="${cardStyle}; grid-row: 1 / span 2;">
        <div style="${codeHeaderStyle}">Custom components</div>
        <div id="file-tree" style="flex:1; overflow:auto; padding:6px 0;"></div>
      </div>
      <div style="${cardStyle}">
        <div style="${cardHeaderStyle}"><span id="active-filename">Editor</span> <span style="font-weight:400; color:${brand.textMuted}; font-size:11px;">own svelte/compiler + Monaco</span></div>
        <div id="editor" style="flex:1; overflow:hidden;"></div>
      </div>
      <div style="${cardStyle}">
        <div style="padding:10px 14px; border-bottom:1px solid ${brand.border}; display:flex; flex-direction:column; gap:6px;">
          <div style="display:flex; justify-content:space-between; align-items:baseline;">
            <span style="color:${brand.textPrimary}; font-size:13px; font-weight:600;">Live preview <span style="font-weight:400; color:${brand.textMuted}; font-size:11px;">sandboxed iframe, mock data</span></span>
          </div>
          <label style="font-size:12px; color:${brand.textMuted}; font-weight:400;">
            mock props (JS object literal):
            <textarea id="mock-props" rows="2" style="width:100%; border:1px solid ${brand.border}; border-radius:4px; padding:4px 6px; font-size:11px; font-family:monospace; resize:vertical; box-sizing:border-box;"></textarea>
          </label>
        </div>
        <iframe id="preview" sandbox="allow-scripts" style="flex:1; border:none;"></iframe>
        <pre id="error-boundary" style="margin:0; padding:8px 14px; color:${brand.danger}; background:#fef2f1; min-height:1.4em; font-size:12px; white-space:pre-wrap; border-top:1px solid ${brand.border};"></pre>
      </div>
      <div style="${cardStyle}">
        <div style="${codeHeaderStyle}">Compiled, before strip (mount wrapper still attached)</div>
        <pre id="pre-strip-output" style="margin:0; padding:10px 14px; overflow:auto; flex:1; font-size:11px; background:${brand.textPrimary}; color:#f0c896;"></pre>
      </div>
      <div style="${cardStyle}">
        <div style="${codeHeaderStyle}">Bundle saved to GCS (mount wrapper stripped)</div>
        <pre id="saved-output" style="margin:0; padding:10px 14px; overflow:auto; flex:1; font-size:11px; background:${brand.textPrimary}; color:#9fdca4;"></pre>
      </div>
    </div>
  </div>
`;

const editorContainer = document.querySelector<HTMLDivElement>('#editor')!;
const preview = document.querySelector<HTMLIFrameElement>('#preview')!;
const errorBoundary = document.querySelector<HTMLPreElement>('#error-boundary')!;
const preStripOutput = document.querySelector<HTMLPreElement>('#pre-strip-output')!;
const savedOutput = document.querySelector<HTMLPreElement>('#saved-output')!;
const mockPropsInput = document.querySelector<HTMLTextAreaElement>('#mock-props')!;
const fileTree = document.querySelector<HTMLDivElement>('#file-tree')!;
const activeFilename = document.querySelector<HTMLSpanElement>('#active-filename')!;
const saveButton = document.querySelector<HTMLButtonElement>('#save-button')!;
const saveStatus = document.querySelector<HTMLSpanElement>('#save-status')!;

const DEFAULT_COMPONENT_KIND: CustomComponentKind = 'stage';
const defaultComponentIndex = customComponents.findIndex(
  (component) => component.kind === DEFAULT_COMPONENT_KIND,
);

let activeIndex = defaultComponentIndex >= 0 ? defaultComponentIndex : 0;

const SECTION_LABELS: Record<CustomComponentKind, string> = {
  stage: 'Stage',
  callback: 'Callback',
};

const sectionHeaderStyle = `padding:8px 14px 4px; font-size:11px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; color:${brand.textMuted};`;

function renderFileTree(): void {
  fileTree.innerHTML = (Object.keys(SECTION_LABELS) as CustomComponentKind[])
    .map((kind) => {
      const entries = customComponents
        .map((component, index) => ({ component, index }))
        .filter(({ component }) => component.kind === kind);

      if (entries.length === 0) {
        return '';
      }

      const rows = entries
        .map(({ component, index }) => {
          const isActive = index === activeIndex;
          return `
            <div data-index="${index}" style="
              padding:7px 14px;
              font-size:13px;
              cursor:pointer;
              color:${isActive ? brand.primary : brand.textPrimary};
              background:${isActive ? '#eaf3fb' : 'transparent'};
              border-left:3px solid ${isActive ? brand.primary : 'transparent'};
            ">${component.name}</div>
          `;
        })
        .join('');

      return `<div style="${sectionHeaderStyle}">${SECTION_LABELS[kind]}</div>${rows}`;
    })
    .join('');
}

function selectComponent(index: number): void {
  activeIndex = index;
  activeFilename.textContent = customComponents[index].name;
  mockPropsInput.value = customComponents[index].mockProps;
  renderFileTree();
  editor.setValue(customComponents[index].source);
  updateSaveButton();
}

function updateSaveButton(): void {
  const canSave = customComponents[activeIndex].saveName !== undefined;
  saveButton.disabled = !canSave;
  saveButton.style.opacity = canSave ? '1' : '0.5';
  saveButton.style.cursor = canSave ? 'pointer' : 'not-allowed';
  saveStatus.textContent = '';
}

async function saveActiveComponent(): Promise<void> {
  const active = customComponents[activeIndex];
  if (!active.saveName) {
    return;
  }

  saveStatus.textContent = 'Saving…';
  try {
    const response = await fetch('/api/save-custom-component', {
      method: 'POST',
      body: JSON.stringify({
        kind: active.kind,
        name: active.saveName,
        source: editor.getValue(),
      }),
    });
    saveStatus.textContent = response.ok ? 'Saved ✓' : `Save failed: ${await response.text()}`;
  } catch (error) {
    saveStatus.textContent = `Save failed: ${
      error instanceof Error ? error.message : 'network error'
    }`;
  }
}

saveButton.addEventListener('click', saveActiveComponent);

fileTree.addEventListener('click', (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-index]');
  if (!target) {
    return;
  }
  selectComponent(Number(target.dataset.index));
});

preview.srcdoc = buildSandboxSrcdoc(buildLoginFrameworkMockDataUrl());

window.addEventListener('message', (event) => {
  if (event.data?.type === 'render-error') {
    errorBoundary.textContent = event.data.message;
  } else if (event.data?.type === 'render-ok') {
    errorBoundary.textContent = '';
  }
});

let debounceHandle: ReturnType<typeof setTimeout> | undefined;

function recompile(): void {
  const source = editor.getValue();
  const { js, css, error } = compileComponent(source);

  if (error) {
    errorBoundary.textContent = error;
    return;
  }

  const previewCode = getMountCode(js, mockPropsInput.value);
  preview.contentWindow?.postMessage({ type: 'render', code: previewCode }, '*');

  preStripOutput.textContent = previewCode;

  const bundleForGcs = stripMountWrapper(previewCode);
  savedOutput.textContent = `${bundleForGcs}\n\n/* css */\n${css}`;
}

function scheduleRecompile(): void {
  clearTimeout(debounceHandle);
  debounceHandle = setTimeout(recompile, 250);
}

definePingBrandTheme();

const editor = monaco.editor.create(editorContainer, {
  value: customComponents[activeIndex].source,
  language: 'html',
  theme: PING_BRAND_THEME_NAME,
  minimap: { enabled: true, side: 'right' },
  automaticLayout: true,
  fontSize: 13,
});

editor.onDidChangeModelContent(scheduleRecompile);

activeFilename.textContent = customComponents[activeIndex].name;
mockPropsInput.value = customComponents[activeIndex].mockProps;
renderFileTree();
updateSaveButton();
mockPropsInput.addEventListener('input', scheduleRecompile);

preview.addEventListener('load', recompile);

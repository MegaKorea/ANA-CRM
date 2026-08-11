#!/usr/bin/env node
/**
 * Guards against a recurring bug class: a CSS Module class applied directly
 * onto an antd component's ROOT element gets silently overridden by antd's
 * own runtime-injected base style (e.g. `.ant-layout-sider { position }`,
 * `.ant-layout-header { padding: 0 50px }`, `.ant-card { border-radius }`).
 *
 * Both our class and antd's class have equal specificity (0,1,0), so which
 * one wins depends on DOM order of the two <style> tags — and AntdRegistry
 * (added for SSR style extraction) can flip that order. This has already
 * bitten Sidebar.module.scss, Header.module.scss, ReportsSupportersTable,
 * and Login.module.scss.
 *
 * Fix: use a compound selector so specificity settles it deterministically —
 *   .sider:global(.ant-layout-sider) { ... }
 * instead of
 *   .sider { ... }
 *
 * This script finds `<AntdComponent className={styles.x}>` usages and checks
 * whether the corresponding CSS Module class is written as a bare selector
 * (risky) or already compounded with `:global(.ant-...)` (safe).
 *
 * Heuristic, not a full type-checker: false negatives are possible (e.g.
 * className passed through a variable instead of a direct `styles.x`
 * reference); false positives are unlikely given the explicit antd-import
 * tracking. Run: node scripts/check-antd-css-overrides.mjs
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import ts from 'typescript';

const ROOT = resolve(import.meta.dirname, '..');
const SCAN_DIRS = ['app', 'components'];
const SKIP_DIR_NAMES = new Set(['node_modules', '.next', '.git']);

// Local name -> antd base class this component renders on its root element.
const ANTD_ROOT_CLASS = {
  Card: 'ant-card',
  Sider: 'ant-layout-sider',
  Header: 'ant-layout-header',
  Footer: 'ant-layout-footer',
  Content: 'ant-layout-content',
  Modal: 'ant-modal',
  Drawer: 'ant-drawer',
  Menu: 'ant-menu',
  Table: 'ant-table',
  Tabs: 'ant-tabs',
  Avatar: 'ant-avatar',
  Alert: 'ant-alert',
  Tag: 'ant-tag',
  Badge: 'ant-badge',
  Layout: 'ant-layout',
};

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIR_NAMES.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, out);
    } else if (extname(entry) === '.tsx') {
      out.push(full);
    }
  }
  return out;
}

function findClassNameStylesRefs(node, stylesLocalName, refs) {
  if (
    ts.isPropertyAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === stylesLocalName &&
    ts.isIdentifier(node.name)
  ) {
    refs.push(node.name.text);
  }
  ts.forEachChild(node, (child) => findClassNameStylesRefs(child, stylesLocalName, refs));
}

function analyzeFile(filePath) {
  const text = readFileSync(filePath, 'utf8');
  const source = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  /** local JSX tag name -> antd base class (e.g. Sider -> ant-layout-sider) */
  const antdLocalNames = new Map();
  /** local identifier -> true if it's the antd `Layout` export */
  const antdLayoutIdentifiers = new Set();
  /** local `styles` identifier -> resolved CSS module file path */
  const stylesImports = new Map();

  const findings = [];

  function visit(node) {
    // import { Card, Layout, Modal } from 'antd'
    if (ts.isImportDeclaration(node) && node.moduleSpecifier.getText(source).replace(/['"]/g, '') === 'antd') {
      const bindings = node.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) {
        for (const el of bindings.elements) {
          const imported = (el.propertyName ?? el.name).text;
          const local = el.name.text;
          if (ANTD_ROOT_CLASS[imported]) {
            antdLocalNames.set(local, ANTD_ROOT_CLASS[imported]);
          }
          if (imported === 'Layout') {
            antdLayoutIdentifiers.add(local);
          }
        }
      }
    }

    // import styles from './X.module.scss'
    if (ts.isImportDeclaration(node) && node.importClause?.name) {
      const spec = node.moduleSpecifier.getText(source).replace(/['"]/g, '');
      if (/\.module\.(scss|css)$/.test(spec)) {
        const resolved = resolve(dirname(filePath), spec);
        stylesImports.set(node.importClause.name.text, resolved);
      }
    }

    // const { Header, Sider, Content, Footer } = Layout;
    if (ts.isVariableDeclaration(node) && node.initializer && ts.isIdentifier(node.initializer)) {
      if (antdLayoutIdentifiers.has(node.initializer.text) && ts.isObjectBindingPattern(node.name)) {
        for (const el of node.name.elements) {
          if (ts.isIdentifier(el.name)) {
            const imported = (el.propertyName && ts.isIdentifier(el.propertyName) ? el.propertyName.text : el.name.text);
            if (ANTD_ROOT_CLASS[imported]) {
              antdLocalNames.set(el.name.text, ANTD_ROOT_CLASS[imported]);
            }
          }
        }
      }
    }

    // <Sider className={styles.sider} ...>
    if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node))) {
      const tagName = node.tagName.getText(source);
      const antdClass = antdLocalNames.get(tagName);
      if (antdClass) {
        const classNameAttr = node.attributes.properties.find(
          (p) => ts.isJsxAttribute(p) && p.name.getText(source) === 'className'
        );
        if (classNameAttr && ts.isJsxAttribute(classNameAttr) && classNameAttr.initializer) {
          const init = classNameAttr.initializer;
          if (ts.isJsxExpression(init) && init.expression) {
            for (const [localStylesName, cssPath] of stylesImports) {
              const refs = [];
              findClassNameStylesRefs(init.expression, localStylesName, refs);
              for (const moduleClass of refs) {
                const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
                findings.push({
                  tsxFile: filePath,
                  line: line + 1,
                  tagName,
                  antdClass,
                  cssPath,
                  moduleClass,
                });
              }
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(source);
  return findings;
}

function isBareSelectorRisky(cssText, className) {
  // Matches `.className {` or `.className,` at the start of a rule (allowing
  // leading whitespace), but not `.className:global(` (already compounded)
  // and not `&.className` / `.className:global` variants elsewhere handled
  // by the negative lookahead on what follows the class name.
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const bareRule = new RegExp(`(^|[^.\\w-])\\.${escaped}(?![\\w-])(?!:global\\()\\s*[{,]`, 'm');
  const compoundRule = new RegExp(`\\.${escaped}:global\\(\\s*\\.ant-`);
  if (compoundRule.test(cssText)) return false;
  return bareRule.test(cssText);
}

let allFindings = [];
for (const dir of SCAN_DIRS) {
  const dirPath = join(ROOT, dir);
  try {
    statSync(dirPath);
  } catch {
    continue;
  }
  for (const file of walk(dirPath)) {
    allFindings.push(...analyzeFile(file));
  }
}

const riskyFindingsByCssFile = new Map();
for (const f of allFindings) {
  let cssText;
  try {
    cssText = readFileSync(f.cssPath, 'utf8');
  } catch {
    continue; // module path didn't resolve (e.g. alias import) — skip, not a false pass we can prove
  }
  if (isBareSelectorRisky(cssText, f.moduleClass)) {
    const key = f.cssPath;
    if (!riskyFindingsByCssFile.has(key)) riskyFindingsByCssFile.set(key, []);
    riskyFindingsByCssFile.get(key).push(f);
  }
}

if (riskyFindingsByCssFile.size === 0) {
  console.log('✓ No unguarded antd root-class overrides found.');
  process.exit(0);
}

console.error(
  `✗ Found ${riskyFindingsByCssFile.size} CSS Module file(s) with a class applied directly onto an antd\n` +
  `  component root, without a :global(.ant-...) compound selector to guarantee it wins the cascade\n` +
  `  tie against antd's own SSR-injected base style. See scripts/check-antd-css-overrides.mjs for why.\n`
);

for (const [cssPath, findings] of riskyFindingsByCssFile) {
  const relCss = cssPath.replace(ROOT + '\\', '').replace(ROOT + '/', '');
  for (const f of findings) {
    const relTsx = f.tsxFile.replace(ROOT + '\\', '').replace(ROOT + '/', '');
    console.error(`  ${relCss}`);
    console.error(`    class ".${f.moduleClass}" applied to <${f.tagName}> at ${relTsx}:${f.line}`);
    console.error(`    fix: .${f.moduleClass}:global(.${f.antdClass}) { ... }\n`);
  }
}

process.exit(1);

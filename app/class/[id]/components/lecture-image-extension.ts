import Image from '@tiptap/extension-image';
import {
  ResizableNodeView,
  getRenderedAttributes,
  mergeAttributes,
} from '@tiptap/core';

export type LectureImageAlign = 'left' | 'center' | 'right';

const OFFSET_THRESHOLD_PX = 2;

function isAlign(value: unknown): value is LectureImageAlign {
  return value === 'left' || value === 'center' || value === 'right';
}

function readOffset(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 0;
}

function isResizeHandle(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest('[data-resize-handle]');
}

function parseOffsetFromElement(element: HTMLElement): number {
  const data = element.getAttribute('data-offset-x');
  if (data != null && data !== '') {
    const n = Number(data);
    if (Number.isFinite(n)) return Math.round(n);
  }
  const left = element.style.left;
  if (left.endsWith('px')) {
    const n = parseFloat(left);
    if (Number.isFinite(n)) return Math.round(n);
  }
  return 0;
}

function applySlide(inner: HTMLElement, offsetX: number, floating: boolean) {
  if (floating) {
    inner.style.position = 'relative';
    inner.style.left = '0px';
    inner.dataset.offsetX = '0';
    return;
  }
  inner.style.position = 'relative';
  inner.style.left = `${offsetX}px`;
  inner.dataset.offsetX = String(offsetX);
}

function isFloatingAlign(align: unknown): boolean {
  return align === 'left' || align === 'right';
}

function syncTrackAlign(track: HTMLElement, align: unknown) {
  const next = isAlign(align) ? align : 'center';
  track.dataset.align = next;
  track.classList.toggle('lecture-img-float-left', next === 'left');
  track.classList.toggle('lecture-img-float-right', next === 'right');
  track.classList.toggle('lecture-img-float-none', next === 'center');

  if (next === 'left') {
    track.style.float = 'left';
    track.style.clear = 'none';
    track.style.display = 'block';
    track.style.width = 'auto';
    track.style.maxWidth = '48%';
    track.style.margin = '0.25em 1em 0.5em 0';
    track.style.textAlign = 'left';
    return;
  }
  if (next === 'right') {
    track.style.float = 'right';
    track.style.clear = 'none';
    track.style.display = 'block';
    track.style.width = 'auto';
    track.style.maxWidth = '48%';
    track.style.margin = '0.25em 0 0.5em 1em';
    track.style.textAlign = 'left';
    return;
  }
  track.style.float = 'none';
  track.style.clear = 'both';
  track.style.display = 'block';
  track.style.width = '100%';
  track.style.maxWidth = '100%';
  track.style.margin = '0.5em 0';
  track.style.textAlign = 'left';
}

/**
 * Lecture image: resize handles, float L/R (text wraps), or center row + slide.
 */
export const LectureImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: 'center' satisfies LectureImageAlign,
        parseHTML: (element) => {
          const data = element.getAttribute('data-align');
          if (isAlign(data)) return data;
          if (element.classList.contains('lecture-img-align-left')) return 'left';
          if (element.classList.contains('lecture-img-align-right')) return 'right';
          if (element.classList.contains('lecture-img-align-center')) return 'center';
          return 'center';
        },
        renderHTML: (attributes) => {
          const align: LectureImageAlign = isAlign(attributes.align)
            ? attributes.align
            : 'center';
          return {
            'data-align': align,
            class: `lecture-img-align-${align}`,
          };
        },
      },
      offsetX: {
        default: 0,
        parseHTML: (element) => parseOffsetFromElement(element),
        renderHTML: (attributes) => {
          const x = readOffset(attributes.offsetX);
          if (!x) return {};
          return {
            'data-offset-x': String(x),
            style: `position: relative; left: ${x}px`,
          };
        },
      },
    };
  },

  addNodeView() {
    if (typeof document === 'undefined') return null;

    const resize = this.options.resize;
    if (!resize || typeof resize !== 'object' || !resize.enabled) {
      return null;
    }

    const { directions, minWidth, minHeight, alwaysPreserveAspectRatio } = resize;
    const resizeManagedAttributes = new Set(['src', 'width', 'height']);
    // offsetX is applied on the resize container, never on <img> — otherwise the
    // photo slides out of the handle frame.
    const containerOnlyAttributes = new Set(['style', 'data-offset-x']);

    const scrubImgOffsetStyles = (el: HTMLImageElement) => {
      el.removeAttribute('data-offset-x');
      el.style.left = '';
      el.style.position = '';
      // Keep width/height from resize; drop leftover offset style fragments.
      if (el.getAttribute('style')?.trim() === '') {
        el.removeAttribute('style');
      }
    };

    return ({ node, getPos, HTMLAttributes, editor }) => {
      const track = document.createElement('div');
      track.className = 'lecture-img-track';
      track.dataset.lectureImgTrack = '';
      track.contentEditable = 'false';

      const img = document.createElement('img');
      img.draggable = false;

      const mergedAttributes = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes);
      Object.entries(mergedAttributes).forEach(([key, value]) => {
        if (value == null) return;
        if (key === 'src' || key === 'width' || key === 'height') return;
        if (containerOnlyAttributes.has(key)) return;
        img.setAttribute(key, String(value));
      });
      if (typeof mergedAttributes.src === 'string') {
        img.src = mergedAttributes.src;
      }
      scrubImgOffsetStyles(img);

      let previousHTMLAttributes = { ...HTMLAttributes };
      const syncImageSource = (src: unknown) => {
        if (typeof src === 'string' && src !== '') {
          if (img.getAttribute('src') !== src) img.src = src;
          return;
        }
        if (img.hasAttribute('src')) img.removeAttribute('src');
      };
      syncImageSource(HTMLAttributes.src);

      const resizable = new ResizableNodeView({
        element: img,
        editor,
        node,
        getPos,
        onResize: (width, height) => {
          img.style.width = `${width}px`;
          img.style.height = `${height}px`;
        },
        onCommit: (width, height) => {
          const pos = getPos();
          if (pos === undefined) return;
          editor
            .chain()
            .setNodeSelection(pos)
            .updateAttributes('image', { width, height })
            .run();
        },
        onUpdate: (updatedNode) => {
          if (updatedNode.type.name !== 'image') return false;

          const extensionAttributes = editor.extensionManager.attributes.filter(
            (attribute) => attribute.type === updatedNode.type.name,
          );
          const newHTMLAttributes = getRenderedAttributes(updatedNode, extensionAttributes);

          Object.keys(previousHTMLAttributes).forEach((key) => {
            if (containerOnlyAttributes.has(key)) return;
            if (!resizeManagedAttributes.has(key) && !(key in newHTMLAttributes)) {
              img.removeAttribute(key);
            }
          });

          Object.entries(newHTMLAttributes).forEach(([key, value]) => {
            if (resizeManagedAttributes.has(key)) return;
            if (containerOnlyAttributes.has(key)) return;
            if (value != null) img.setAttribute(key, String(value));
            else img.removeAttribute(key);
          });

          syncImageSource(newHTMLAttributes.src);
          scrubImgOffsetStyles(img);
          previousHTMLAttributes = newHTMLAttributes;
          const floating = isFloatingAlign(updatedNode.attrs.align);
          applySlide(
            resizable.dom as HTMLElement,
            floating ? 0 : readOffset(updatedNode.attrs.offsetX),
            floating,
          );
          syncTrackAlign(track, updatedNode.attrs.align);
          return true;
        },
        options: {
          directions,
          min: { width: minWidth, height: minHeight },
          preserveAspectRatio: alwaysPreserveAspectRatio === true,
        },
      });

      const inner = resizable.dom as HTMLElement;
      inner.classList.add('lecture-img-node');
      inner.style.display = 'inline-flex';
      inner.style.maxWidth = '100%';
      {
        const floating = isFloatingAlign(node.attrs.align);
        applySlide(inner, floating ? 0 : readOffset(node.attrs.offsetX), floating);
        syncTrackAlign(track, node.attrs.align);
      }

      track.appendChild(inner);

      // Reveal after image loads (same idea as TipTap Image node view).
      inner.style.visibility = 'hidden';
      inner.style.pointerEvents = 'none';
      img.onload = () => {
        inner.style.visibility = '';
        inner.style.pointerEvents = '';
      };
      if (img.complete) {
        inner.style.visibility = '';
        inner.style.pointerEvents = '';
      }

      const offsetState = { active: false };

      const onPointerDown = (event: PointerEvent) => {
        if (!editor.isEditable) return;
        if (event.button !== 0) return;
        if (isResizeHandle(event.target)) return;

        event.preventDefault();
        event.stopPropagation();

        const pos = getPos();
        if (typeof pos === 'number') {
          editor.commands.setNodeSelection(pos);
        }

        const liveNode =
          typeof pos === 'number' ? editor.state.doc.nodeAt(pos) : null;
        const liveAlign = liveNode?.attrs.align ?? node.attrs.align;
        // Float L/R: text wraps beside image — no free horizontal slide.
        if (isFloatingAlign(liveAlign)) return;

        const startX = event.clientX;
        const startOffset = readOffset(liveNode?.attrs.offsetX ?? node.attrs.offsetX);
        let currentOffset = startOffset;
        let started = false;

        const trackWidth = track.clientWidth;
        const innerWidth = inner.offsetWidth;
        let maxOffset = Math.max(0, trackWidth - innerWidth);

        // Full-width image: shrink a bit so there is room to slide.
        if (maxOffset < 8 && trackWidth > 80) {
          const nextWidth = Math.floor(trackWidth * 0.72);
          const ratio =
            img.naturalHeight && img.naturalWidth
              ? img.naturalHeight / img.naturalWidth
              : inner.offsetHeight / Math.max(inner.offsetWidth, 1);
          const nextHeight = Math.max(40, Math.round(nextWidth * ratio));
          img.style.width = `${nextWidth}px`;
          img.style.height = `${nextHeight}px`;
          if (typeof pos === 'number') {
            editor
              .chain()
              .setNodeSelection(pos)
              .updateAttributes('image', { width: nextWidth, height: nextHeight })
              .run();
          }
          maxOffset = Math.max(0, trackWidth - nextWidth);
        }

        const onPointerMove = (moveEvent: PointerEvent) => {
          const dx = moveEvent.clientX - startX;
          if (!started) {
            if (Math.abs(dx) < OFFSET_THRESHOLD_PX) return;
            started = true;
            offsetState.active = true;
            track.classList.add('lecture-img-offsetting');
            inner.classList.add('lecture-img-offsetting');
          }
          moveEvent.preventDefault();
          currentOffset = Math.max(0, Math.min(maxOffset, Math.round(startOffset + dx)));
          applySlide(inner, currentOffset, false);
        };

        const finish = () => {
          window.removeEventListener('pointermove', onPointerMove, true);
          window.removeEventListener('pointerup', onPointerUp, true);
          window.removeEventListener('pointercancel', onPointerUp, true);
          track.classList.remove('lecture-img-offsetting');
          inner.classList.remove('lecture-img-offsetting');
          offsetState.active = false;
          if (!started) return;

          const latestPos = getPos();
          if (typeof latestPos !== 'number') return;
          editor
            .chain()
            .setNodeSelection(latestPos)
            .updateAttributes('image', { offsetX: currentOffset })
            .run();
        };

        const onPointerUp = () => finish();

        window.addEventListener('pointermove', onPointerMove, true);
        window.addEventListener('pointerup', onPointerUp, true);
        window.addEventListener('pointercancel', onPointerUp, true);
      };

      // Capture so ProseMirror does not eat the gesture.
      track.addEventListener('pointerdown', onPointerDown, true);

      return {
        dom: track,
        ignoreMutation: () => true,
        selectNode: () => {
          track.classList.add('lecture-img-selected');
          inner.classList.add('lecture-img-selected');
        },
        deselectNode: () => {
          track.classList.remove('lecture-img-selected');
          inner.classList.remove('lecture-img-selected');
        },
        stopEvent: (event: Event) => {
          if (offsetState.active) return true;
          if (isResizeHandle(event.target)) return true;
          if (event.type.startsWith('pointer') || event.type.startsWith('mouse')) {
            if (track.contains(event.target as Node) && !isResizeHandle(event.target)) {
              return true;
            }
          }
          return false;
        },
        update: (updatedNode, decorations, innerDecorations) =>
          resizable.update(updatedNode, decorations, innerDecorations),
        destroy: () => {
          track.removeEventListener('pointerdown', onPointerDown, true);
          resizable.destroy();
        },
      };
    };
  },
});

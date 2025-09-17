"use client";

import {
  AppBar,
  AppBarSection,
  AppBarSpacer,
} from "@progress/kendo-react-layout";
import { Button, ButtonGroup } from "@progress/kendo-react-buttons";
import { gearIcon } from "@progress/kendo-svg-icons";
import { useRef, useState, useEffect, type CSSProperties } from "react";

const NucliaSearchBar = 'nuclia-search-bar' as unknown as React.ElementType;
const NucliaSearchResults = 'nuclia-search-results' as unknown as React.ElementType;

interface SharedAppBarProps {
  onOpenChallengeDialog?: () => void;
  onOpenIdeaDialog?: () => void;
  onOpenResourceDialog?: () => void;
  onOpenTaskDialog?: () => void;
  onOpenRagSettings?: () => void;
  showSearchOverlay?: boolean;
  setShowSearchOverlay?: (show: boolean) => void;
  ragSettings?: {
    apiKey: string;
    knowledgebox: string;
    zone: string;
    account: string;
    kbslug: string;
    backend: string;
    cdn: string;
  };
}

export function SharedAppBar({
  onOpenChallengeDialog,
  onOpenIdeaDialog,
  onOpenResourceDialog,
  onOpenTaskDialog,
  onOpenRagSettings,
  showSearchOverlay = false,
  setShowSearchOverlay,
  ragSettings = {
    apiKey: '',
    knowledgebox: '',
    zone: '',
    account: '',
    kbslug: '',
    backend: 'https://rag.progress.cloud/api',
    cdn: 'https://cdn.rag.progress.cloud/'
  }
}: SharedAppBarProps) {
  const searchRef = useRef<HTMLDivElement | null>(null);
  const [overlayStyle, setOverlayStyle] = useState<{ left: number; top: number; width: number } | undefined>();

  const positionOverlay = () => {
    const el = searchRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setOverlayStyle({ left: rect.left, top: rect.bottom + 8, width: rect.width });
  };

  useEffect(() => {
    const onResize = () => positionOverlay();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <>
      <AppBar positionMode="sticky" className="border-b border-black/10 bg-white">
        <AppBarSection className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-black/10 text-sm font-semibold uppercase">
            DEV
          </span>
          <div>
            <p className="text-sm font-semibold text-black">Challenge HQ</p>
            <p className="text-xs text-neutral-500">Ideate, plan, and publish.</p>
          </div>
        </AppBarSection>
        <AppBarSpacer style={{ flex: 1 }} />
        <AppBarSection style={{ overflow: 'visible', pointerEvents: 'auto', position: 'relative', display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
          {/* Nuclia Search Bar */}
          <div ref={searchRef} style={{ display: 'inline-block' }}>
            <NucliaSearchBar
              className="nuclia-host"
              style={{ width: 420, height: 36, display: 'inline-block', zIndex: 10 } as CSSProperties}
              audit_metadata='{"config":"nuclia-standard","widget":"test"}'
              knowledgebox={ragSettings.knowledgebox}
              zone={ragSettings.zone}
              state="PRIVATE"
              account={ragSettings.account}
              kbslug={ragSettings.kbslug}
              apikey={ragSettings.apiKey}
              backend={ragSettings.backend}
              cdn={ragSettings.cdn}
              features="answers,rephrase,suggestions,autocompleteFromNERs,citations,hideResults"
              rag_strategies="neighbouring_paragraphs|2|2"
              feedback="none"
              onfocus={() => {
                positionOverlay();
                setShowSearchOverlay?.(true);
              }}
            ></NucliaSearchBar>
          </div>
          <Button svgIcon={gearIcon} fillMode="flat" onClick={onOpenRagSettings} title="RAG Settings" />

          {showSearchOverlay && setShowSearchOverlay && (
            <div
              className="fixed z-[9999] rounded-xl border border-black/10 bg-white p-2 shadow-2xl"
              style={overlayStyle}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end pb-1">
                <button
                  className="text-xs text-neutral-600 hover:text-black"
                  onClick={() => setShowSearchOverlay(false)}
                >
                  Close
                </button>
              </div>
              <NucliaSearchResults></NucliaSearchResults>
            </div>
          )}
        </AppBarSection>
        <AppBarSpacer style={{ flex: 1 }} />
        <AppBarSection>
          <ButtonGroup>
            <Button onClick={onOpenChallengeDialog}>Challenge</Button>
            <Button onClick={onOpenIdeaDialog}>Idea</Button>
            <Button onClick={onOpenResourceDialog}>Resource</Button>
            <Button onClick={onOpenTaskDialog}>Task</Button>
          </ButtonGroup>
        </AppBarSection>
      </AppBar>
    </>
  );
}

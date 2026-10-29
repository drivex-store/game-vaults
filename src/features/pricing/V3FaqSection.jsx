'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { t } from '@/libs/utils/i18n'; // module id: 398682
import FaqBaseLayout from '@/features/common/FaqBaseLayout'; // module id: 752362
import MorphingAccordion from '@/features/common/MorphingAccordion'; // module id: 4707

const FAQ_LINKS_MAP = [
  { "Every Annnimate tier": "/pricing" },
  { "Annnimate Studio": "/pricing" },
  {},
  { "14-day money-back guarantee": "/refund" },
  {
    "Next.js App Router": "/nextjs",
    "Nuxt ready": "/nuxt",
  },
  { "MCP server": "/docs/guides/mcp" },
  {
    "free Starter Pack": "/starter-pack",
    "live preview": "/animations",
  },
  { "Landmark Kit purchase": "/kits" },
];

function linkifyAnswerText(text, linkMapping = {}) {
  const targetKeywords = Object.keys(linkMapping).filter((keyword) =>
    text.includes(keyword)
  );

  if (!targetKeywords.length) {
    return text;
  }

  const escapedKeywords = targetKeywords.map((keyword) =>
    keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );

  const regexPattern = new RegExp(`(${escapedKeywords.join('|')})`);

  return text.split(regexPattern).map((part, index) => {
    if (linkMapping[part]) {
      return (
        <Link
          key={index}
          href={linkMapping[part]}
          className="underline decoration-foreground/40 underline-offset-2 transition-[text-decoration-color] duration-200 hover:decoration-foreground"
        >
          {part}
        </Link>
      );
    }
    return part;
  });
}

export default function V3Faq({
  namespace = 'home-v3.faq',
  links = FAQ_LINKS_MAP,
  vars = {},
  items = null,
}) {
  const containerRef = useRef(null);

  const formatTemplate = (templateStr) => {
    return templateStr.replace(/\{(\w+)\}/g, (match, key) => {
      if (key === 'cap') {
        return 25;
      }
      return vars[key] ?? match;
    });
  };

  const resolvedItems = (items ?? t(`${namespace}.items`)).map(({ q, a }) => ({
    q: formatTemplate(q),
    a: formatTemplate(a),
  }));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateMinHeight = () => {
      if (!window.matchMedia('(min-width: 1024px)').matches) {
        container.style.minHeight = '';
        return;
      }

      const listEl = container.querySelector('.macc_list');
      const panels = [...container.querySelectorAll('.macc_panel')];

      if (!listEl || !panels.length) {
        return;
      }

      const totalPanelsHeight = panels.reduce((sum, panel) => sum + panel.offsetHeight, 0);
      const listHeightDifference = listEl.offsetHeight - totalPanelsHeight;
      const maxHeight = Math.max(...panels.map((panel) => panel.scrollHeight));

      container.style.minHeight = `${listHeightDifference + maxHeight + 32}px`;
    };

    document.fonts?.ready.then(updateMinHeight);
    updateMinHeight();

    const resizeObserver = new ResizeObserver(updateMinHeight);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const formattedFaqItems = resolvedItems.map(({ q, a }, index) => ({
    question: q,
    answer: linkifyAnswerText(a, links[index]),
  }));

  return (
    <div className="v3-faq">
      <FaqBaseLayout
        faqs={resolvedItems}
        theme="dark"
        headline={t(`${namespace}.headline`)}
        subtext={t(`${namespace}.subtext`)}
        list={
          <div ref={containerRef}>
            <MorphingAccordion items={formattedFaqItems} startOpen={null} />
          </div>
        }
      />
    </div>
  );
}

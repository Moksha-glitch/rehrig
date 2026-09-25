import React from 'react';
import { Page, PageHeader, Panel } from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';

export default function Support() {
  const { scopedAccounts } = useStore();
  const account = scopedAccounts?.[0];
  const phone = account?.phone || '(886) 742-8232';
  const email = account?.supportEmail || 'rehrigtechsupport@rehrig.com';

  return (
    <Page>
      <div className="relative overflow-hidden rounded-b-xl bg-gradient-to-br from-brand to-[#2f7fc4] px-8 py-10 text-white">
        <h1 className="max-w-xl text-[22px] font-semibold leading-snug">
          Communication is the key to productive partnering.
          <br />
          We are excited about meeting you and helping with your needs.
        </h1>
      </div>
      <div className="space-y-4 p-6">
        <PageHeader overline="Help" title="Support" description="Get in touch with our U.S. Customer Service." />
        <Panel>
          <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
            <div>
              <div className="text-[12.5px] font-semibold text-ink-muted">Support Phone</div>
              <div className="mt-1 text-sm font-medium text-ink">{phone}</div>
            </div>
            <div>
              <div className="text-[12.5px] font-semibold text-ink-muted">Support Email</div>
              <a href={`mailto:${email}`} className="mt-1 block text-sm font-medium text-brand">
                {email}
              </a>
            </div>
          </div>
        </Panel>
        <Panel>
          <div className="border-b border-line px-5 py-3 text-[13px] font-semibold text-ink">
            Support Video Library
          </div>
          <div className="flex items-center justify-between gap-3 px-5 py-4 text-sm">
            <span className="text-ink-muted">Access Support Help Videos</span>
            <a
              href="https://www.youtube.com/@rehrigvisionsoftwareservic7400"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand underline"
            >
              Go to Library
            </a>
          </div>
        </Panel>
      </div>
    </Page>
  );
}

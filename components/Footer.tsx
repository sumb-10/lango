export function Footer() {
  return (
    <footer className="border-t border-[#E6E0D6] bg-surface px-4 md:px-8 py-6">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-[#5E5E5E]" style={{ fontSize: '12px' }}>
            <a href="#" className="hover:text-[#76B88A] transition-colors">이용약관</a>
            <span className="hidden sm:inline">·</span>
            <a href="#" className="hover:text-[#76B88A] transition-colors">개인정보처리방침</a>
            <span className="hidden sm:inline">·</span>
            <a href="mailto:support@lango.app" className="hover:text-[#76B88A] transition-colors">
              support@lango.app
            </a>
          </div>
          <div className="text-[#5E5E5E]" style={{ fontSize: '12px' }}>
            v1.0.0-beta
          </div>
        </div>
      </div>
    </footer>
  );
}

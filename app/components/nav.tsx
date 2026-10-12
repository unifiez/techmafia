export default function Footer() {
    const link = "text-on-surface-variant hover:text-on-surface underline underline-offset-4 decoration-black decoration-2";
    return (
        <footer className="w-full bg-surface-container-low border-t-[2.5px] border-black mt-auto">
            <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-space-md">
                <div className="flex flex-col sm:flex-row items-center gap-space-md">
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-surface-container-lowest border-[2px] border-black">
                        <span className="material-symbols-outlined text-on-surface text-[16px]">speed</span>
                        <span className="font-code text-code text-on-surface">MATCH FORMAT: 4v4 // 20 MIN</span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                        © 2026 TECH MAFIA // FIND THE HACKER. ALL RIGHTS RESERVED.
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-space-md font-label-md text-label-md">
                    <a className={link} href="#">Fair Play Rules</a>
                    <a className={link} href="#">Tournament Rules</a>
                    <a className={link} href="#">Support Desk</a>
                </div>
            </div>
        </footer>
    );
}
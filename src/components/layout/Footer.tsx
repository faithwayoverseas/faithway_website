import Link from "next/link";
import Image from "next/image";

export const Footer = () => {
  return (
    <footer className="bg-midnight pt-32 pb-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-royal/5 blur-[150px] -z-10" />
      
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 mb-24">
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-4 group mb-8">
              <div className="relative w-14 h-14 overflow-hidden rounded-xl">
                <Image 
                  src="/logo.png" 
                  alt="Faithway Overseas Logo" 
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <span className="text-3xl font-outfit font-bold tracking-tighter text-white">
                FAITHWAY<span className="text-gold">OVERSEAS</span>
              </span>
            </Link>

            <p className="text-white/40 text-lg mb-10 leading-relaxed font-light">
              Crafting global legacies through elite immigration consultancy. We turn international aspirations into reality with precision and absolute integrity.
            </p>
            <div className="flex items-center gap-6">
              {["𝕏", "In", "Ig", "Fb"].map((social) => (
                <Link
                  key={social}
                  href="#"
                  className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-royal hover:bg-royal/10 transition-all duration-300"
                >
                  {social}
                </Link>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-white font-bold mb-8 uppercase tracking-[0.2em] text-xs">Destinations</h4>
            <ul className="space-y-4">
              {["Canada", "Australia", "United Kingdom", "USA", "Europe"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-white/40 hover:text-gold transition-colors font-light">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-white font-bold mb-8 uppercase tracking-[0.2em] text-xs">Services</h4>
            <ul className="space-y-4">
              {["Express Entry", "Skilled Migration", "Study Permits", "Golden Visas", "Work Permits"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-white/40 hover:text-gold transition-colors font-light">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h4 className="text-white font-bold mb-8 uppercase tracking-[0.2em] text-xs">Stay Elite</h4>
            <p className="text-white/40 mb-8 font-light">Subscribe to receive exclusive insights on global immigration trends.</p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Email Address"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 grow focus:border-royal outline-none text-white transition-all"
              />
              <button className="bg-royal hover:bg-royal/80 text-white w-14 h-14 rounded-xl flex items-center justify-center transition-all">
                →
              </button>
            </form>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-white/20 text-sm font-light">
            © 2026 Faithway Overseas. All rights reserved. Designed for excellence.
          </p>
          <div className="flex items-center gap-10">
            <Link href="#" className="text-white/20 hover:text-white text-sm transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-white/20 hover:text-white text-sm transition-colors">Terms of Service</Link>
            <Link href="#" className="text-white/20 hover:text-white text-sm transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

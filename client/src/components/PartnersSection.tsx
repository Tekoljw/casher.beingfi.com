import { motion } from 'framer-motion';
import LogoLoop from './LogoLoop/LogoLoop';
import { 
  SiVisa, 
  SiMastercard, 
  SiPaypal, 
  SiStripe, 
  SiAlipay, 
  SiWechat,
  SiApple,
  SiGoogle,
  SiBitcoin,
  SiEthereum,
  SiAmazonpay,
  SiSamsung
} from 'react-icons/si';

const paymentLogos = [
  { node: <SiVisa />, title: "Visa" },
  { node: <SiMastercard />, title: "Mastercard" },
  { node: <SiPaypal />, title: "PayPal" },
  { node: <SiStripe />, title: "Stripe" },
  { node: <SiAlipay />, title: "Alipay" },
  { node: <SiWechat />, title: "WeChat Pay" },
  { node: <SiApple />, title: "Apple Pay" },
  { node: <SiGoogle />, title: "Google Pay" },
  { node: <SiBitcoin />, title: "Bitcoin" },
  { node: <SiEthereum />, title: "Ethereum" },
  { node: <SiAmazonpay />, title: "Amazon Pay" },
  { node: <SiSamsung />, title: "Samsung Pay" },
];

export default function PartnersSection() {
  return (
    <section id="partners" className="py-20 relative">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold font-poppins mb-6 relative inline-block text-white">
            Trusted by Industry Leaders
            <span className="absolute -bottom-2 left-1/4 w-1/2 h-1 bg-emerald-500 rounded-full"></span>
          </h2>
          <p className="text-gray-400">Supporting all major payment methods and platforms worldwide</p>
        </motion.div>
        
        <motion.div 
          className="relative overflow-hidden py-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <LogoLoop
            logos={paymentLogos}
            speed={80}
            direction="left"
            logoHeight={48}
            gap={80}
            hoverSpeed={0}
            scaleOnHover
            fadeOut
            fadeOutColor="transparent"
            ariaLabel="Payment partners"
          />
        </motion.div>
      </div>
    </section>
  );
}

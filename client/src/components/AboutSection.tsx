import { motion } from 'framer-motion';

export default function AboutSection() {
  const features = [
    {
      title: 'Innovation',
      description: 'Pioneering new gaming concepts that push the boundaries of traditional casino games.',
      icon: 'fa-rocket'
    },
    {
      title: 'Security',
      description: 'Provably fair games with advanced security measures to ensure player protection.',
      icon: 'fa-shield-alt'
    },
    {
      title: 'Community',
      description: 'Building social features that connect players and create shared experiences.',
      icon: 'fa-users'
    },
    {
      title: 'Mobile-First',
      description: 'Optimized for seamless play across all devices with focus on mobile experience.',
      icon: 'fa-mobile-alt'
    }
  ];

  return (
    <section id="about" className="py-24 relative bg-dark">
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-darkSecondary to-transparent -z-10"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10"></div>
      
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative z-10">
              <img 
                src="https://source.unsplash.com/random/800x600/?team,development" 
                alt="Our Team" 
                className="w-full h-auto rounded-xl shadow-2xl shadow-accent/10 object-cover" 
              />
            </div>
            
            <motion.div 
              className="absolute -top-6 -left-6 transform -rotate-6 bg-darkSecondary p-4 rounded-lg shadow-lg w-48 z-20 animate-float"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-dark">
                  <i className="fas fa-trophy"></i>
                </div>
                <div className="ml-3">
                  <div className="text-xs text-gray-400">Award Winner</div>
                  <div className="font-medium">Game of the Year</div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="absolute -bottom-6 -right-6 bg-darkSecondary p-4 rounded-lg shadow-lg z-20 animate-float"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              style={{ animationDelay: '0.7s' }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-900 rounded-full overflow-hidden">
                  <img 
                    src="https://source.unsplash.com/random/100x100/?executive,ceo" 
                    alt="CEO" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div>
                  <div className="font-medium">David Chen</div>
                  <div className="text-xs text-gray-400">Founder & CEO</div>
                </div>
              </div>
            </motion.div>
            
            <div className="absolute -bottom-4 left-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl -z-10"></div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6">
              <h2 className="text-3xl md:text-4xl font-bold font-poppins mb-6 relative inline-block">
                About Spribe
                <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-accent rounded-full"></span>
              </h2>
              <p className="text-gray-400 mb-6">Founded in 2018, Spribe is a leading provider of next-generation casino games designed for the modern, mobile-first generation of players.</p>
              <p className="text-gray-400 mb-6">Our mission is to revolutionize the casino game industry by creating innovative, engaging, and fair gaming experiences that appeal to a broader audience beyond traditional casino players.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {features.map((feature, index) => (
                <motion.div 
                  key={feature.title}
                  className="bg-gray-900 p-5 rounded-lg"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                >
                  <div className="w-12 h-12 bg-accent/20 text-accent rounded-lg flex items-center justify-center mb-4">
                    <i className={`fas ${feature.icon} text-xl`}></i>
                  </div>
                  <h3 className="text-xl font-bold font-poppins mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
            
            <a href="#contact" className="px-8 py-3 bg-accent hover:bg-accent/90 text-black font-medium rounded-md transition-all duration-300 inline-flex items-center">
              Join Our Team <i className="fas fa-arrow-right ml-2"></i>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

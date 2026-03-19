import { motion } from 'framer-motion';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function ContactSection() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, this would send data to the server
    console.log('Form submitted:', formData);
    
    toast({
      title: "Message Sent",
      description: "Thanks for reaching out! We'll get back to you soon.",
    });
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  const contactInfo = [
    {
      title: 'Address',
      content: '123 Gaming Avenue, Tech District\nLondon, UK',
      icon: 'fa-map-marker-alt'
    },
    {
      title: 'Email',
      content: 'info@spribe.co\npartnerships@spribe.co',
      icon: 'fa-envelope'
    },
    {
      title: 'Phone',
      content: '+44 123 456 7890\n+44 987 654 3210',
      icon: 'fa-phone-alt'
    }
  ];

  const socialLinks = [
    { icon: 'fa-twitter', href: '#' },
    { icon: 'fa-linkedin-in', href: '#' },
    { icon: 'fa-facebook-f', href: '#' },
    { icon: 'fa-instagram', href: '#' }
  ];

  return (
    <section id="contact" className="py-24 relative">
      
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold font-poppins mb-6 relative inline-block">
              Get in Touch
              <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-accent rounded-full"></span>
            </h2>
            <p className="text-gray-400 mb-8">Have questions about our games or partnership opportunities? Contact our team for more information.</p>
            
            <div className="space-y-6 mb-8">
              {contactInfo.map((info, index) => (
                <motion.div 
                  key={info.title}
                  className="flex items-start"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className="w-12 h-12 bg-accent/20 text-accent rounded-lg flex items-center justify-center mr-4">
                    <i className={`fas ${info.icon}`}></i>
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">{info.title}</h3>
                    <p className="text-gray-400 whitespace-pre-line">{info.content}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="flex space-x-4">
              {socialLinks.map((link, index) => (
                <motion.a 
                  key={index}
                  href={link.href}
                  className="w-10 h-10 bg-gray-900 hover:bg-accent text-white hover:text-black rounded-full flex items-center justify-center transition-colors duration-300"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.05 * index }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <i className={`fab ${link.icon}`}></i>
                </motion.a>
              ))}
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-gray-900 rounded-2xl p-8 md:p-10 shadow-xl relative"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/30 rounded-full blur-3xl -z-10"></div>
            
            <h3 className="text-2xl font-bold font-poppins mb-6">Send us a Message</h3>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">Your Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-accent" 
                    placeholder="John Doe"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-accent" 
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-400 mb-2">Subject</label>
                <input 
                  type="text" 
                  id="subject" 
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-accent" 
                  placeholder="Partnership Inquiry"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-400 mb-2">Message</label>
                <textarea 
                  id="message" 
                  rows={5} 
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-accent" 
                  placeholder="Your message here..."
                  required
                ></textarea>
              </div>
              
              <motion.button 
                type="submit" 
                className="w-full py-3 bg-accent hover:bg-accent/90 text-black font-medium rounded-md transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Send Message
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

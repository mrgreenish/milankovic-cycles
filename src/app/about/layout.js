export const metadata = {
  title: 'About | Milanković Cycles Simulation',
  description: 'About Filip van Harreveld and his connection to Milutin Milanković',
};

// Set revalidation time to 6 hours (21600 seconds)
export const revalidate = 21600;

export default function AboutLayout({ children }) {
  return children;
} 
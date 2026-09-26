import {useRef} from 'react';
import {useMotionScene} from '@site/src/motion/useMotionScene';
import Layout from '@theme/Layout';
import Hero from '@site/src/components/sections/Hero';
import Objectives from '@site/src/components/sections/Objectives';
import Data from '@site/src/components/sections/Data';
import DatesVenue from '@site/src/components/sections/DatesVenue';
import ImportantDates from '@site/src/components/sections/ImportantDates';
import Schedule from '@site/src/components/sections/Schedule';
import Apply from '@site/src/components/sections/Apply';
import Organizers from '@site/src/components/sections/Organizers';
import Links from '@site/src/components/sections/Links';

export default function Home() {
  // Temporary GSAP consumer (Task 3 replaces it with the hero scene).
  const pageRef = useRef<HTMLElement>(null);
  useMotionScene(pageRef, () => undefined);
  return (
    <Layout description="GeTH Hackathon 2027: six days in Chiang Mai analysing 50,000 Thai genomes inside a Trusted Research Environment.">
      <main ref={pageRef}>
        <Hero />
        <Objectives />
        <Data />
        <DatesVenue />
        <ImportantDates />
        <Schedule />
        <Apply />
        <Organizers />
        <Links />
      </main>
    </Layout>
  );
}

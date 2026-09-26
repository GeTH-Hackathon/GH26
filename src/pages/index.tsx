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
  return (
    <Layout description="GeTH Hackathon 2027: six days in Chiang Mai analysing 50,000 Thai genomes inside a Trusted Research Environment.">
      <main>
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

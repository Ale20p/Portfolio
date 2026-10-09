import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Layout } from '@components';
import { getTheme, classic as ClassicTheme, DEFAULT_THEME } from '@components/themes';

// -------------------------------------------------------------
// Active Theme Configuration
// Options: 'classic' | any theme registered in src/components/themes/index.js
// Can also be set via environment variable: GATSBY_THEME=theme-name
// -------------------------------------------------------------
const ACTIVE_THEME = process.env.GATSBY_THEME || DEFAULT_THEME;

// Load the selected theme's sections with fallback to Classic
const CurrentTheme = getTheme(ACTIVE_THEME);

const Hero = CurrentTheme.Hero || ClassicTheme.Hero;
const About = CurrentTheme.About || ClassicTheme.About;
const Jobs = CurrentTheme.Jobs || ClassicTheme.Jobs;
const Featured = CurrentTheme.Featured || ClassicTheme.Featured;
const Projects = CurrentTheme.Projects || ClassicTheme.Projects;
const Contact = CurrentTheme.Contact || ClassicTheme.Contact;

const StyledMainContainer = styled.main`
  counter-reset: section;
`;

const IndexPage = ({ location }) => (
  <Layout location={location}>
    <StyledMainContainer className="fillHeight">
      <Hero />
      <About />
      <Jobs />
      <Featured />
      <Projects />
      <Contact />
    </StyledMainContainer>
  </Layout>
);

IndexPage.propTypes = {
  location: PropTypes.object.isRequired,
};

export default IndexPage;

1. Create _Personas_ for more accurate User Story and AC creation and detailed 'in silico' User Testing - Check
2. Create a usability test system, manually triggered or automated, with synthetic users based on Personas from 1.
3. Use ([Pirsch](https://pirsch.io)) for Tracking
   1. [Serverside](https://docs.pirsch.io/get-started/backend-integration)
   2. With [client-hints](https://docs.pirsch.io/get-started/client-hints)
   3. At first tracking pageviews and ui_interactions (clicks/taps)
   4. Parameter driven to reduce the number of inividual events - each interactable element has or gets an attribute which is passed by the ui_interaction event and identifies it
   5. The ui_interation event also has parameters for page-context and app-context to further identify where the click happened
   6. The pageview also carries parameters that help with the analysis of user behaviour and customer journeys / funnels

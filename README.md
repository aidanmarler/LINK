# LINK
Welcome to **LINK**, the Language Integration Network Kit!

Proudly presented by [CONAGIO](contagio.network) and [ISARIC](isaric.org), LINK is our tool for verifying automatic machine translations of the [ARC](https://github.com/ISARICResearch/ARC) database. 

Our goal is to create a system that can translate segements into any language using best-practices translation methodology. Specifically, we look to the TRAPD translation framework for methodological guidance.

With the help of users from around the world, we hope to make the [BRIDGE](bridge.isaric.org) application as accessible and helpful to clinicians and researchers everywhere.

## Background
ISARIC has developed a suite of tools to aid researchers from data collection through to analysis. Developed in a pandemic and kept up to ensure we are prepared for the next one.
- ARC is the library of variables complete with questions, answers, definitions, and compltion guides. 
- BRIDGE is the interactive data dictionary and CRF generator, allowing users to add and remove variables at will.
- VERTEX allows researchers analyze thier RedCap data, and even pool processed data for shared analysis.

ISARIC and CONTAGIO both focus on global connection and reach, empowering people to do research at the local level that can be compared and analyzed globally.

So CONTAGIO has partnered with ISARIC to translate the entire ARC library into Spanish, French, and Portuguese with LINK. 
All processes and procedures developed for these translations can, and will, be adapted to any other language from Arabic to Albanian!

CONTAGIO is a larger project, and we are also working with ISARIC to develop several new CRFs for BRIDGE as well as a variable manager, enabling users to create their own custom questions and submit them for review so that even if ARC doesn't have a specific question you need, you will still be able to easily connect and use the entire suite of ISARIC's tools.

## How does it work?
LINK works by first pulling in the ARC database into a SupaBase relational database, letting users interact with segments by adding Forward Translations, Reviews, and Backward Translations. 
Finally, accepted translations from this process are uploaded back into the ARC database, stored in ARC Translations.

### Schema
Our schema has 7 tables that take any segment through the TRAPD translation process.
- **original_segments**: segments to translate from English into any other language.
- **forward_translations**: translations of an original segment into a given language.
- **translation_reviews**: review of all posted forward translations, voting which is correct (if any).
- **backward_translations**: translation of accepted forward translation back into English.
- **translation_progress**: progress on which step of translation any given segment-language pair is in.
- **accepted_translations**: which translation is accepted as the best one thus far, and why?
- **profiles**: store some user information tied to a uuid.

### Methodology
We use the TRAPD translation framework, which has been identified by the translation community as an effective model for translation that imroves upon simple Forward and Backward translation by utilizing a team of experts. TRAPD stands for Translation, Review, Adjudication, Pre-Test and Documentation.
In TRAPD, the steps would be 
1. **Forward Translation** - translate a given segment from language A to language B
2. **Review** - as a team, review translation to ensure it is correct or pose one that would be.
3. **Backward Translation** - translate accepted translation back from language B to language A.
4. **Adjudication** - have one central adjudicator determine if translation is good or not and needs to be re-done.
5. **Pre-Test** - field test the translation.
6. **Documentation** - Not just at the end but from the very start, document meetings and descisions. _Which translations were accepted and rejected? Why? Who did what?_

### Technology Used
LINK uses Svelte, Typescript, TailwindCSS, Supabase, and GitHub GraphQL.

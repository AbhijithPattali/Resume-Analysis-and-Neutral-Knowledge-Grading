Project Logbook

Research and planning - Week 3 - 4
- Defined the project focus as a privacy-aware resume ranking system for recruiter-led CV screening.
- Investigated the recruitment technology problem space, including transparency, privacy, fairness, and automation in candidate screening.
- Reviewed background literature on resume parsing, keyword matching, semantic similarity, TF-IDF, cosine similarity, WordNet, and related NLP approaches.
- Examined existing open-source and commercial recruitment tools to identify strengths, limitations, and the research gap addressed by the project.
- Established the original research direction, aims, objectives, requirements, use cases, and feasibility assumptions for the proposed system.
- Planned the project structure, milestones, risks, and expected deliverables for the dissertation work.

Design and preparation - Week 5
- Designed the initial system concept as an offline-oriented recruiter tool for uploading CVs, entering keywords, and receiving ranked outputs.
- Produced early design ideas and interface planning material, including architecture thinking, workflow design, and Figma-based mock-ups.
- Defined the intended recruiter journey from document upload to keyword entry and result interpretation.
- Prepared synthetic CV data for ethical testing and avoided the use of real applicant information.
- Set up the development environment and selected the tools, libraries, and technologies needed for implementation.

Frontend development - Week 7
- Built the browser-based interface for uploading multiple PDF CVs.
- Added drag-and-drop and file-picker upload support to improve usability.
- Implemented a visible upload list and file counter so the user could review selected CVs before processing.
- Added the ability to remove files before submission to support batch adjustment during the upload stage.
- Refined the interface into a single-page workflow instead of separating the process across disconnected pages.
- Implemented the recruiter tag-entry interface with keyword pills that could be added and removed interactively.
- Improved the tag input behaviour so multi-word input could be handled more effectively during matching.
- Updated the visual design to create a more coherent and polished user interface for the final prototype.

Backend development - Week 8
- Built the backend application using Python and Flask to manage uploads, processing, and ranking.
- Implemented PDF CV ingestion and text extraction as the first stage of the processing pipeline.
- Added normalization logic to clean extracted text before later comparison.
- Tokenized processed CV content and stored the results in a generated JSON structure for reuse.
- Created the route and logic for generating downloadable JSON output after CV processing.
- Fixed file path handling so generated JSON was saved consistently in the correct project location.
- Implemented backend handling for recruiter-submitted tags and prepared them for comparison with CV tokens.

Ranking implementation - Week 9
- Delivered a working ranking pipeline based on exact token matching between recruiter tags and processed CV content.
- Used normalized token sets to compare uploaded CVs against recruiter-defined keywords.
- Calculated match scores using the number of overlapping terms between the recruiter input and each CV.
- Sorted CVs into ranked order based on the resulting match counts.
- Returned ranked results to the frontend and displayed matched terms for greater transparency.
- Chose to deliver a simpler exact-match baseline instead of a partially completed semantic stack, in order to prioritise a stable and demonstrable final system.

Testing and evaluation - Week 10
- Tested the upload workflow under normal use conditions, including file selection, removal, and submission behaviour.
- Verified that the interface correctly transitioned from upload mode into post-processing mode after successful CV processing.
- Checked that the system generated valid JSON output and that the processed data could be inspected and reused.
- Tested recruiter tag entry, tag removal, and tag submission to ensure correct communication between frontend and backend.
- Validated the ranking logic by using known keywords and checking whether expected CVs moved upward in the results.
- Reviewed performance at prototype scale and confirmed that the matching stage remained lightweight once the CV data had been processed.
- Reflected on usability through repeated interaction testing of the single-page workflow.
- Identified practical limitations relating to exact-match ranking, dataset scope, file-format support, and the lack of advanced semantic methods in the delivered build.

Reflection and final reporting - Week 11
- Compared the final implementation against the broader original proposal and documented where scope was reduced.
- Reframed the final contribution as a transparent, privacy-aware baseline prototype rather than a fully realized semantic recruitment platform.
- Added discussion of limitations, trade-offs, bias risks, interpretability, and future work to strengthen the academic quality of the final report.
- Wrote the final implementation, evaluation, discussion, conclusion, and project-changes sections for the post-project completion report.
- Prepared appendices containing supplementary design, implementation, and interface material to support the dissertation.

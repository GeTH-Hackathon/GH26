/**
 * Creates the GeTH Hackathon 2027 application form (Google Forms) and a linked response sheet.
 *
 * How to run:
 *   1. Sign in to the Google account that should own the form.
 *   2. Open https://script.google.com → New project → paste this file → Save.
 *   3. Select `createApplicationForm` and click Run. Approve the permissions prompt.
 *   4. Open View → Logs (or the Execution log). Copy the "Share this URL" link.
 *   5. Put that link in `formUrl` in src/data/event.ts, commit and push.
 *
 * Google does not let Apps Script create file-upload questions. To collect the GCP certificate
 * file, add one by hand afterwards (see the note in the log output).
 */

const TERMS_URL = 'https://geth-hackathon.github.io/GH26/terms/';
const WORDS_200 = 1500; // ~200 words
const WORDS_100 = 750; // ~100 words

function createApplicationForm() {
  const form = FormApp.create('Genomics Thailand Hackathon 2027 Chiang Mai — Application Form');
  form
    .setDescription(
      'GeTH Hackathon 2027 · 7–12 February 2027 · Chiang Mai, Thailand\n\n' +
        'Please complete all sections and submit before the registration deadline.',
    )
    .setCollectEmail(true)
    .setProgressBar(true)
    .setShowLinkToRespondAgain(false)
    .setConfirmationMessage(
      'Thank you for applying to GeTH Hackathon 2027. Selected participants will be announced in January 2027.',
    );

  const text = (title, help, required = true) => form.addTextItem().setTitle(title).setHelpText(help || '').setRequired(required);
  const para = (title, help, maxChars, required = true) => {
    const item = form.addParagraphTextItem().setTitle(title).setHelpText(help || '').setRequired(required);
    if (maxChars) {
      item.setValidation(
        FormApp.createParagraphTextValidation()
          .requireTextLengthLessThanOrEqualTo(maxChars)
          .setHelpText(`Please keep your answer under ${maxChars} characters.`)
          .build(),
      );
    }
    return item;
  };
  const choice = (title, options, {other = false, required = true, help = ''} = {}) =>
    form.addMultipleChoiceItem().setTitle(title).setHelpText(help).setChoiceValues(options).showOtherOption(other).setRequired(required);
  const checks = (title, options, {other = false, required = false, help = ''} = {}) =>
    form.addCheckboxItem().setTitle(title).setHelpText(help).setChoiceValues(options).showOtherOption(other).setRequired(required);
  const section = (title, help) => form.addPageBreakItem().setTitle(title).setHelpText(help || '');

  // Section 1: Personal Information (first page, no page break before it)
  form.addSectionHeaderItem().setTitle('Section 1: Personal Information');
  text('Full Name (English)');
  text('Full Name (Thai)', 'If applicable', false);
  choice('Title / Prefix', ['Mr.', 'Ms.', 'Dr.', 'Prof.'], {other: true});
  form.addDateItem().setTitle('Date of Birth').setHelpText('DD / MM / YYYY').setRequired(true);
  text('Nationality');
  text('Email Address').setValidation(
    FormApp.createTextValidation().requireTextIsEmail().setHelpText('Please enter a valid email address.').build(),
  );
  text('Phone Number');
  text('LINE ID', 'Optional', false);

  // Section 2: Affiliation & Background
  section('Section 2: Affiliation & Background');
  text('Institution / Organization');
  text('Faculty / Department');
  text('Current Position / Role', 'e.g., student, researcher, developer');
  choice('Level of Study (if student)', ['Bachelor', 'Master', 'PhD', 'Postdoc', 'Not a student'], {required: false});
  text('Field of Expertise', 'e.g., bioinformatics, data science, biology, IT');
  text('Years of Experience').setValidation(
    FormApp.createTextValidation().requireNumberGreaterThanOrEqualTo(0).setHelpText('Please enter a number.').build(),
  );
  checks(
    'Relevant informatics skills',
    ['Programming (Python/R)', 'Machine Learning / AI', 'Statistics', 'Data visualization', 'Cloud / HPC', 'Project management'],
    {other: true, help: 'Check all that apply'},
  );
  checks('Relevant genomic experience', ['Genomics / NGS analysis', 'Molecular biology', 'Clinical / medical'], {
    other: true,
    help: 'Check all that apply',
  });
  para('One of your publications relevant to omics analysis', 'If applicable: citation, DOI or link', null, false);

  // Section 3: Motivation & Experience
  section('Section 3: Motivation & Experience');
  para('Why do you want to join the Genomics Thailand Hackathon?', 'Max ~200 words', WORDS_200);
  para('Briefly describe relevant projects or experience in genomics / data science', 'Max ~200 words', WORDS_200);
  para('What do you expect from this Hackathon? And why should we support you?', 'Max ~200 words', WORDS_200);
  para('Do you have a tentative idea for this hackathon?', 'Max ~100 words', WORDS_100, false);

  // Section 4: Logistics
  section('Section 4: Logistics');
  choice('Do you require a flight?', ['Yes', 'No']);
  text('If yes, from which province?', 'Leave blank if you do not require a flight', false);
  choice('Do you require accommodation?', ['Yes', 'No']);
  choice('How did you hear about the event?', ['Event website', 'Social media', 'Colleague / supervisor', 'Email / mailing list'], {
    other: true,
  });

  // Section 5: Declaration & Consent
  section(
    'Section 5: Declaration & Consent',
    'I confirm that the information provided above is accurate and complete. I agree to abide by the event rules and code of conduct ' +
      `(${TERMS_URL}), and I consent to the collection and processing of my personal data in accordance with the ` +
      'Personal Data Protection Act (PDPA), B.E. 2562 (2019), for the purposes of this event.',
  );
  checks('Declaration', ['I agree to the terms and PDPA consent above'], {required: true}).setValidation(
    FormApp.createCheckboxValidation().requireSelectExactly(1).setHelpText('You must agree to apply.').build(),
  );
  choice('Do you hold an unexpired Good Clinical Practice (GCP) certificate?', ['Yes', 'No']);
  form.addDateItem().setTitle('GCP certificate expiry date').setHelpText('If you answered Yes').setRequired(false);
  choice('Do you have any conflict of interest to declare?', ['No', 'Yes']);
  para('If yes, please describe the conflict of interest', '', null, false);
  text('Signature', 'Type your full name as your electronic signature');
  form.addDateItem().setTitle('Date').setRequired(true);

  // Responses go to a new Google Sheet next to the form.
  const sheet = SpreadsheetApp.create('GeTH Hackathon 2027 — Applications (responses)');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  Logger.log('Share this URL (put it in formUrl in src/data/event.ts): ' + form.getPublishedUrl());
  Logger.log('Edit the form: ' + form.getEditUrl());
  Logger.log('Responses sheet: ' + sheet.getUrl());
  Logger.log(
    'Optional, by hand: to collect the GCP certificate file, open the form editor → Section 5 → add a "File upload" question ' +
      '(respondents must then sign in to Google to apply).',
  );
}

import type { FixedLanguageList, NestedTexts } from 'src/language/languages';

export function nb(): FixedLanguageList {
  return {
    altinn: {
      standard_validation: {
        file_content_type_not_allowed:
          'Det ser ut som du prøver å laste opp en filtype som ikke er tillatt. Sjekk at filen faktisk er av den typen den utgir seg for å være.',
      },
    },
    actions: {
      sign: 'Signer',
      confirm: 'Bekreft',
      reject: 'Avslå',
      instantiate: 'Instansier',
    },
    address_component: {
      address: 'Gateadresse',
      care_of: 'C/O eller annen tilleggsadresse',
      house_number: 'Bolignummer',
      house_number_helper:
        'Om adressen er felles for flere boenhenter må du oppgi bolignummer. Den består av en bokstav og fire tall og skal være ført opp ved/på inngangsdøren din.',
      post_place: 'Poststed',
      simplified: 'Enkel',
      title_text_binding: 'Søk etter ledetekst for Adressekomponenten',
      zip_code: 'Postnr',
      validation_error_zipcode: 'Postnummer er ugyldig. Et postnummer består kun av 4 siffer.',
      validation_error_house_number: 'Bolignummer er ugyldig',
    },
    confirm: {
      answers: 'Dine svar',
      attachments: 'Vedlegg',
      body: 'Du er nå  klar for å sende inn {0}. Før du sender inn vil vi anbefale å se over svarene dine. Du kan ikke endre svarene etter at du har sendt inn.',
      button_text: 'Send inn',
      deadline: 'Frist innsending',
      sender: 'Aktør',
      title: 'Se over svarene dine før du sender inn',
    },
    custom_actions: {
      general_error: 'Noe gikk galt med denne handlingen. Prøv igjen senere.',
    },
    date_picker: {
      invalid_date_message: 'Ugyldig datoformat. Bruk formatet {0}.',
      cancel_label: 'Avbryt',
      clear_label: 'Tøm',
      today_label: 'I dag',
      min_date_exeeded: 'Datoen du har valgt er før tidligst tillatte dato.',
      max_date_exeeded: 'Datoen du har valgt er etter seneste tillatte dato.',
      aria_label_icon: 'Åpne datovelger',
      aria_label_left_arrow: 'Forrige måned.',
      aria_label_right_arrow: 'Neste måned.',
      aria_label_year_dropdown: 'Velg år',
      aria_label_month_dropdown: 'Velg måned',
      format_text: 'For eksempel {0}',
    },
    feedback: {
      title: '## Du blir snart videresendt',
      body: 'Vi venter på verifikasjon, når den er på plass blir du videresendt.',
    },
    form_filler: {
      error_add_subform: 'Det oppstod en feil ved opprettelse av underskjema, vennligst prøv igjen',
      error_delete_subform: 'Noe gikk galt ved sletting av underskjema, vennligst prøv igjen',
      error_fetch_subform: 'Feil ved lasting av skjemadata',
      error_max_count_reached_subform_server: 'Maks antall {0} oppføringer har blitt nådd',
      error_max_count_reached_subform_local: 'Maks antall {0} oppføringer har blitt nådd {1}',
      error_min_count_not_reached_subform: 'Minst {0} {1} oppføring er påkrevd',
      error_validation_inside_subform: 'Det er feil i en eller flere {0} oppføringer',
      subform_default_header: 'Oppføringer',
      back_to_summary: 'Tilbake til oppsummering',
      alert_confirm: 'Bekreft',
      checkbox_alert: 'Er du sikker på at du vil fjerne avkrysningen?',
      multi_select_alert: 'Er du sikker på at du vil slette <b>{0}</b>?',
      dropdown_alert: 'Er du sikker på at du vil endre til <b>{0}</b>?',
      error_report_header: 'Du må rette disse feilene før du kan gå videre',
      error_required: 'Du må fylle ut {0}',
      file_upload_valid_file_format_all: 'alle',
      file_uploader_add_attachment: 'Legg til flere vedlegg',
      file_uploader_drag: 'Dra og slipp eller',
      file_uploader_find: 'let etter fil',
      file_uploader_list_delete: 'Slett vedlegg',
      file_uploader_delete_warning: 'Er du sikker på at du vil slette dette vedlegget?',
      file_uploader_delete_button_confirm: 'Ja, slett vedlegg',
      file_uploader_list_header_file_size: 'Filstørrelse',
      file_uploader_list_header_name: 'Navn',
      file_uploader_list_header_status: 'Status',
      file_uploader_list_status_done: 'Ferdig lastet',
      file_uploader_list_header_delete_sr: 'Slett',
      file_uploader_max_size_mb: 'Maks filstørrelse {0} MB',
      file_uploader_upload: 'Last opp fil',
      file_uploader_number_of_files: 'Antall filer {0}.',
      file_uploader_show_more_errors: 'Vis {0} flere',
      file_uploader_show_fewer_errors: 'Vis færre',
      file_uploader_valid_file_format: 'Tillatte filformater er:',
      file_uploader_failed_to_upload_file: 'Filen <u title="{1}">{0}</u> kunne ikke lastes opp',
      file_uploader_validation_error_delete: 'Noe gikk galt under slettingen av filen, prøv igjen senere.',
      file_uploader_validation_error_exceeds_max_files:
        'Du kan ikke laste opp flere enn {0} filer. Ingen filer ble lastet opp.',
      file_uploader_validation_error_file_ending: 'er ikke blant de tillatte filtypene.',
      file_uploader_validation_error_file_number: 'For å fortsette må du laste opp {0} vedlegg',
      file_uploader_validation_error_file_size: '{0} overskrider tillatt filstørrelse.',
      file_uploader_validation_error_general:
        'Det var et problem med filen {0}. Forsikre deg om at filen har rett filtype og ikke overskrider maks filstørrelse.',
      file_uploader_validation_error_upload: 'Noe gikk galt under opplastingen av filen, prøv igjen senere.',
      file_uploader_validation_error_update: 'Noe gikk galt under oppdatering av filens merking, prøv igjen senere.',
      file_uploader_validation_error_no_chosen_tag: 'Du må velge {0}',
      placeholder_receipt_header: 'Skjemaet er nå fullført og sendt inn.',
      placeholder_user: 'OLA PRIVATPERSON',
      radiobutton_alert_label: 'Er du sikker på at du vil endre fra {0}?',
      required_description: 'Obligatoriske felter er markert med *',
      required_label: '*',
      summary_item_change: 'Endre',
      summary_go_to_correct_page: 'Gå til riktig side i skjema',
      address: 'Gateadresse',
      careOf: 'C/O eller annen tilleggsadresse',
      houseNumber: 'Bolignummer',
      postPlace: 'Poststed',
      zipCode: 'Postnr',
      no_options_found: 'Fant ingen treff',
      clear_selection: 'Fjern alle valgte',
      person_lookup_ssn: 'fødselsnummer',
      person_lookup_name: 'navn',
      organisation_lookup_orgnr: 'organisasjonsnummer',
      organisation_lookup_name: 'organisasjonsnavn',
    },
    navigation: {
      main: 'Appnavigasjon',
      form: 'Skjemanavigasjon',
      to_main_content: 'Hopp til hovedinnholdet',
      go_to_task: 'Gå til {0}',
    },
    general: {
      action: 'Handling',
      accessibility: 'Tilgjengelighet',
      accessibility_url: 'https://info.altinn.no/om-altinn/tilgjengelighet/',
      add_connection: 'Legg til tilkobling',
      add_new: 'Legg til ny',
      add: 'Legg til',
      back: 'Tilbake',
      cancel: 'Avbryt',
      choose_label: 'Velg navn',
      choose_method: 'Velg metode',
      choose: 'Velg',
      close_schema: 'Lukk skjema',
      close: 'Lukk',
      contains: 'Inneholder',
      control_submit: 'Kontroller og send inn',
      create_new: 'Opprett ny',
      create: 'Opprett',
      customer_service_phone_number: '+47 75 00 60 00',
      customer_service_slack: 'https://altinn.slack.com',
      customer_service_email: 'servicedesk@altinn.no',
      customer_service_error_message:
        'Hvis du har behov for assistanse kan du nå Altinn på<br/><br/><li>Telefon: <a href="tel:{0}">{0}</a></li><li>E-post: {1}</li><li>Slack: {2}</li></ul>',
      delete: 'Slett',
      download: 'Nedlasting {0}',
      disabled: 'Deaktivert',
      done: 'Ferdig',
      edit_alt_error: 'Rett feil her',
      edit_alt: 'Rediger',
      edit: 'Endre',
      empty_summary: 'Du har ikke lagt inn informasjon her',
      enabled: 'Aktivert',
      error_message_with_colon: 'Feilmelding:',
      expand_form: 'Utvid skjema',
      for: 'for',
      header_profile_icon_label: 'Profil ikon knapp',
      label: 'Navn',
      loading: 'Laster innhold',
      log_out: 'Logg ut',
      next: 'Neste',
      no_options: 'Ingen alternativer tilgjenglig',
      optional: 'Valgfri',
      page_number: 'Side {0}',
      print_button_text: 'Print / Lagre PDF',
      progress: 'Side {0} av {1}',
      required: 'Obligatorisk',
      save: 'Lagre',
      save_and_close: 'Lagre og lukk',
      save_and_next: 'Lagre og åpne neste',
      search: 'Søk',
      select_field: 'Velg felt',
      service_description_header: 'Beskrivelse',
      service_name: 'Tjenestenavn',
      service_owner: 'Tjenesteeier',
      service_saved_name: 'Lagringsnavn',
      submit: 'Send inn',
      validate_changes: 'Validér endringer',
      value: 'Verdi',
      version: 'Versjon',
      wait_for_attachments: 'Vent litt, vi prosesserer vedlegg',
      part_of_form_completed: 'Denne delen av skjemaet er ikke tilgjengelig. Du kan ikke gjøre endringer her nå.',
      invalid_task_id: 'Denne delen av skjemaet finnes ikke.',
      navigate_to_current_process: 'Gå til riktig prosessteg',
    },
    group: {
      row_error: 'En av radene er ikke fylt ut riktig, dette må fikses før skjema kan sendes inn',
      row_popover_delete_message: 'Er du sikker på at du vil slette denne raden?',
      row_popover_delete_button_confirm: 'Ja, slett raden',
    },
    iframe_component: {
      unsupported_browser_title: 'Nettleseren din støttes ikke',
      unsupported_browser:
        'Nettleseren du bruker støtter ikke iframes som benytter seg av srcdoc. Dette kan føre til at du ikke ser all innholdet som er ment å vises her. Vi anbefaler deg å prøve en annen nettleser.',
    },
    input_components: {
      character_limit_sr_label: 'Tekstfeltet kan inneholde maks {0} tegn',
      remaining_characters: 'Du har {0} av {1} tegn igjen',
      exceeded_max_limit: 'Du har overskredet maks antall tegn med {0}',
    },
    instance_selection: {
      changed_by: 'Endret av',
      continue: 'Fortsett her',
      description: 'Velg om du vil fortsette på et skjema du har begynt på, eller om du vil starte på ny.',
      header: 'Du har allerede startet å fylle ut dette skjemaet.',
      last_changed: 'Sist endret',
      left_of: 'Fortsett der du slapp',
      new_instance: 'Start på nytt',
    },
    instantiate: {
      all_forms: 'alle skjema',
      inbox: 'innboks',
      profile: 'profil',
      unknown_error_title: 'Ukjent feil',
      unknown_error_text: 'Det har skjedd en ukjent feil, vennligst prøv igjen senere.',
      unknown_error_status: 'Ukjent feil',
      unknown_error_customer_support: 'Om problemet vedvarer, ta kontakt med oss på brukerservice {0}.',
      forbidden_action_error_title: 'Du mangler rettigheter til å utføre denne handlingen',
      forbidden_action_error_text: 'Det ser ut til at du mangler rettigheter til å utføre denne handlingen.',
      forbidden_action_error_status: '403 - Forbidden',
      forbidden_action_error_customer_support: 'Hvis du trenger hjelp, ta kontakt med oss på brukerservice <br/> {0}.',
      authorization_error_main_title: 'Du mangler rettigheter for å se denne tjenesten.',
      authorization_error_instantiate_validation_title: 'Du kan ikke starte denne tjenesten',
      authorization_error_rights: 'Det ser ut til at du ikke har rettigheter til å starte denne tjenesten for {0}',
      authorization_error_ask:
        'Om du representerer en person, er det den du representerer som kan gi deg rettighet til å starte tjenesten. Representerer du en organisasjon er det de som har rollen tilgangsstyring innad i organisasjonen som kan gi deg rettighet.',
      authorization_error_check_rights:
        '<a href="https://{0}/ui/Profile/" target="_blank">Se hvem som har rollen tilgangsstyring under "Andre med rettigheter til virksomheten"</a>.',
      authorization_error_info_rights:
        '<a href="https://{0}/hjelp/profil/enkelttjenester-og-roller/" target="_blank">Her finner du mer informasjon om roller og rettigheter</a>.',
      authorization_error_info_customer_service: 'Du kan også kontakte oss på brukerservice {0}.',
      authorization_error_instantiate_validation_info_customer_service:
        'Om du står fast kontakt oss på brukerservice {0}.',
      starting: 'Vent litt, vi henter det du trenger',
    },
    language: {
      full_name: {
        nb: 'Norsk bokmål',
        en: 'Engelsk',
        nn: 'Nynorsk',
      },
      selector: {
        label: 'Språk',
      },
    },
    party_selection: {
      error_caption_prefix: 'Feil',
      invalid_selection_first_part: 'Du har startet tjenesten som',
      invalid_selection_second_part: 'Denne tjenesten er kun tilgjengelig for',
      invalid_selection_third_part: 'Velg ny aktør under.',
      no_valid_selection_first_part: 'Dette er en tjeneste for {0}',
      no_valid_selection_second_part:
        'Det ser ut som du ikke har tilgang til en aktør som har lov til å starte <b>{0}</b>.',
      no_valid_selection_third_part: 'For å starte denne tjenesten må du ha tilganger som knytter deg til en {0}.',
      no_valid_selection_binding_word: 'og',
      change_party: 'skift aktør her',
      read_more_roles_link: 'Her finner du mer informasjon om roller og rettigheter',
      binding_word: 'eller',
      header: 'Hvem vil du sende inn for?',
      load_more: 'Last flere',
      search_placeholder: 'Søk etter aktør',
      subheader: 'Dine aktører som kan starte tjenesten:',
      unit_type_private_person: 'privatperson',
      unit_type_company: 'virksomhet',
      unit_type_bankruptcy_state: 'konkursbo',
      unit_type_subunit: 'underenhet',
      unit_type_subunit_plural: 'underenheter',
      unit_deleted: 'slettet',
      unit_org_number: 'org.nr.',
      unit_personal_number: 'personnr.',
      show_deleted: 'Vis slettede',
      show_sub_unit: 'Vis underenheter',
      why_seeing_this: 'Hvorfor ser jeg dette?',
      seeing_this_preference:
        'Du kan endre [profilinnstillingene](https://altinn.no/ui/Profile) dine for å ikke bli spurt om aktør hver gang du starter utfylling av et nytt skjema. Du finner denne innstillingen under **Profil** > **Avanserte innstillinger** > **Jeg ønsker ikke å bli spurt om aktør hver gang jeg starter utfylling av et nytt skjema**.',
      seeing_this_override: 'Denne appen er satt opp til å alltid spørre om aktør.',
    },
    payment: {
      pay: 'Betal',
      summary: 'Oppsummering',
      alert: {
        paid: 'Du har betalt!',
        failed: 'Betalingen feilet',
      },
      receipt: {
        title: 'Betalingskvittering',
        payment_id: 'Betalings ID',
        altinn_ref: 'Altinn reference',
        payment_date: 'Dato for kjøp',
        total_amount: 'Total beløp',
        receiver: 'Mottaker',
        payer: 'Betaler',
        name: 'Navn',
        phone: 'Telefon',
        company_name: 'Firmanavn',
        org_number: 'Organisasjonsnummer',
        contact_person: 'Kontaktperson',
        contact_phone: 'Kontakttelefon',
        contact_email: 'Kontakt-e-post',
        address: 'Addresse',
        org_num: 'Organisasjonsnummer',
        account_number: 'Kontonummer',
        card_number: 'Kortnummer',
        card_expiry: 'Utløpsdato',
        email: 'E-post',
      },
      component: {
        description: 'Beskrivelse',
        quantity: 'Antall',
        price: 'Pris',
        total: 'Totalt',
        vat: 'MVA',
      },
    },
    organisation_lookup: {
      orgnr_label: 'Organisasjonsnummer',
      org_name: 'Organisasjonsnavn',
      from_registry_description: 'Fra enhetsregisteret',
      validation_error_not_found: 'Organisasjonsnummeret ble ikke funnet i enhetsregisteret',
      validation_invalid_response_from_server: 'Ugyldig respons fra server',
      unknown_error: 'Ukjent feil. Vennligst prøv igjen senere',
      validation_error_orgnr: 'Organisasjonsnummeret er ugyldig',
    },
    person_lookup: {
      ssn_label: 'Fødselsnummer',
      surname_label: 'Etternavn',
      name_label: 'Navn',
      from_registry_description: 'Fra folkeregisteret',
      validation_error_name_too_short: 'Etternavn må være minst 2 tegn langt',
      validation_error_ssn: 'Fødselsnummeret/D-nummeret er ugyldig.',
      validation_error_not_found:
        'Ingen person er registrert med denne kombinasjonen av fødselsnummer/D-nummer og navn. Vennligst kontroller feltene og prøv igjen. \n\nMerk: Etter 5 feilforsøk blir søkemuligheten midlertidig sperret.',
      validation_error_too_many_requests: 'Du har nådd grensen for antall søk. Vennligst prøv igjen senere.',
      validation_error_forbidden:
        'Du har ikke tilgang til å søke på denne personen. Sikkerhetsnivå 2 eller høyere kreves.',
      validation_invalid_response_from_server: 'Det oppstod en feil. Vennligst prøv igjen senere.',
      unknown_error: 'Ukjent feil. Vennligst prøv igjen senere.',
    },
    signee_list: {
      parse_error: 'Feil ved lasting av signatarliste.',
      wrong_task_error: 'SigneeList-komponenten er kun tilgjengelig i et signeringssteg.',
      unknown_api_error: 'En feil oppstod under henting av signatarer.',
      api_error_display: 'En feil oppstod under henting av signatarer. Se devtool-loggene for mer informasjon.',
      signee_status_signed: 'Signert',
      signee_status_waiting: 'Venter på signering',
      signee_status_delegation_failed: 'Delegering mislyktes',
      signee_status_notification_failed: 'Varsling mislyktes',
      header_name: 'Navn',
      header_on_behalf_of: 'På vegne av',
      header_status: 'Status',
    },
    signing_document_list: {
      parse_error: 'Feil ved lasting av dokumenter.',
      wrong_task_error: 'SigningDocumentList-komponenten er kun tilgjengelig i et signeringssteg.',
      unknown_api_error: 'En feil oppstod under henting av doumenter.',
      api_error_display: 'En feil oppstod under henting av dokumenter. Se devtool-loggene for mer informasjon.',
      header_filename: 'Navn',
      header_attachment_type: 'Vedleggstype',
      header_size: 'Størrelse',
      attachment_type_form: 'Skjema',
    },
    helptext: {
      button_title: 'Hjelp',
      button_title_prefix: 'Hjelpetekst for',
    },
    receipt: {
      attachments: 'Vedlegg',
      body: 'Det er gjennomført en maskinell kontroll under utfylling, men vi tar forbehold om at det kan bli oppdaget feil under saksbehandlingen og at annen dokumentasjon kan være nødvendig. Vennligst oppgi referansenummer ved eventuelle henvendelser til etaten.',
      body_simple:
        'Av sikkerhetshensyn vil verken innholdet i tjenesten eller denne meldingen være synlig i Altinn etter at du har forlatt denne siden.',
      date_sent: 'Dato sendt',
      receiver: 'Mottaker',
      receipt: 'Kvittering',
      ref_num: 'Referansenummer',
      sender: 'Avsender',
      subtitle: 'Kopi av din kvittering er sendt til ditt arkiv',
      title: 'Skjemaet er sendt inn',
      title_submitted: 'Følgende er sendt inn:',
    },
    receipt_platform: {
      attachments: 'Vedlegg',
      date_sent: 'Dato sendt',
      helper_text:
        'Det er gjennomført en maskinell kontroll under utfylling, men vi tar forbehold om at det kan bli oppdaget feil under saksbehandlingen og at annen dokumentasjon kan være nødvendig. Vennligst oppgi referansenummer ved eventuelle henvendelser til etaten.',
      is_sent: 'er sendt inn',
      receipt: 'Kvittering',
      receiver: 'Mottaker',
      reference_number: 'Referansenummer',
      sender: 'Avsender',
      sent_content: 'Følgende er sendt inn:',
      log_out: 'Logg ut',
      profile_icon_aria_label: 'Profil ikon knapp',
    },
    soft_validation: {
      info_title: 'Lurt å tenke på',
      warning_title: 'OBS',
      success_title: 'Så flott!',
    },
    validation: {
      generic_field: 'dette feltet',
    },
    validation_errors: {
      min: 'Minste gyldig tall er {0}',
      max: 'Største gyldig tall er {0}',
      minLength: 'Bruk {0} eller flere tegn',
      maxLength: 'Bruk {0} eller færre tegn',
      length: 'Antall tillatte tegn er {0}',
      pattern: 'Feil format eller verdi',
      required: 'Feltet er påkrevd',
      enum: 'Kun verdiene {0} er tillatt',
      minItems: 'Minst {0} rader er påkrevd',
      maxItems: 'Maks {0} rader er tillatt',
    },
    map_component: {
      selectedLocation: 'Valgt lokasjon: {0}° nord, {1}° øst',
      noSelectedLocation: 'Ingen lokasjon valgt',
    },
    multiple_select_component: {
      no_options: 'Ingen valg tilgjengelig',
      placeholder: 'Velg...',
    },
    list_component: {
      rowsPerPage: 'Rader per side',
      of: 'av',
      navigateFirstPage: 'Naviger til første side i tabell',
      previousPage: 'Forrige side i tabell',
      nextPage: 'Neste side i tabell',
      navigateLastPage: 'Naviger til siste side i tabell',
    },
    config_error: {
      layoutset_subform_config_error:
        'Layout set med id <strong>{0}</strong> er konfigurert feil.<br /><br />Layout set kan ikke ha både <strong>type</strong> <em>og</em> <strong>tasks</strong> definert.',
      layoutset_error: 'Layout set error',
      component_has_errors: 'En feil oppstod for <code>{0}</code>:',
      component_has_errors_after:
        'Så lenge komponenten har konfigurasjonsfeil kan vi ikke vise den i skjemaet. Rett opp i feilene og prøv igjen.',
      subform_no_datatype_layoutset: 'Datatype-spesifikasjon ikke funnet i layout-sets.json.',
      subform_no_datatype_appmetadata: "Datatype '{0}' ble ikke funnet i applicationmetadata.json.",
      subform_misconfigured_add_button:
        "Datatype '{0}' er markert som 'disallowUserCreate=true', men underskjema-komponenten er konfigurert med 'showAddButton=true'. Dette er en motsetning, siden brukeren aldri vil få lov til å utføre handlingene bak legg-til knappen.",
    },
    version_error: {
      version_mismatch: 'Versjonsfeil',
      version_mismatch_message:
        'Denne versjonen av app frontend er ikke kompatibel med den versjonen av backend-bibliotekene du bruker. Oppdater til nyeste versjon av pakkene og prøv igjen.',
      min_backend_version: 'Minimum backend versjon er {0}',
    },
    missing_row_id_error: {
      title: 'Mangler rad-ID',
      message:
        'Når data ble lastet inn manglet det en rad-ID. Dette er en feil i konfigurasjonen av skjemaet, og må rettes opp ved hjelp av migreringsverktøyene. Sjekk loggene i utviklerverktøyene for mer informasjon.',
      full_message:
        'Datamodellen mangler egenskapen {0} i stien {1}. Dette skal automatisk bli lagt til i datamodellen dersom du bruker riktig versjon av nuget-pakkene og har kjørt migreringsverktøyene. Les mer om verktøyene i dokumentasjonen: https://docs.altinn.studio/community/changelog/app-nuget/v8/migrating-from-v7/',
    },
    likert: {
      left_column_default_header_text: 'Spørsmål',
    },
    process_error: {
      submit_error_please_retry: 'Noe gikk galt under innsendingen, prøv igjen om noen minutter.',
    },
    pdfPreview: {
      error: 'Kunne ikke forhåndsvise PDF',
      defaultButtonText: 'Forhåndsvis PDF',
    },
  } satisfies NestedTexts;
}

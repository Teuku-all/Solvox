import React, { useState } from 'react';
import PixelIcon from '../shared/PixelIcon';
import useDialogKeyboard from '../shared/useDialogKeyboard';
import useAnimatedDismiss from '../shared/useAnimatedDismiss';

const EMAIL = 't.al.jumanatul.ali53@gmail.com';
const WHATSAPP = '6282162934592';

export default function Feedback({ onClose, lang, t }) {
  const { closing, dismiss } = useAnimatedDismiss(onClose);
  const dialogRef = useDialogKeyboard(dismiss);
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState('pedagogy');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [opened, setOpened] = useState('');
  const english = lang === 'en';
  const categories = [
    ['pedagogy', t('feedbackCategoryPedagogy')],
    ['gameplay', t('feedbackCategoryGameplay')],
    ['ui', t('feedbackCategoryUI')],
    ['bug', t('feedbackCategoryBug')],
  ];
  const categoryLabel = categories.find(([id]) => id === category)?.[1] || category;
  const draft = [
    english ? 'Feedback for Solvox' : 'Feedback untuk Solvox',
    `${t('feedbackCategory')}: ${categoryLabel}`,
    `${t('rating')}: ${rating}/5`,
    '',
    message.trim(),
  ].join('\n');
  const subject = `[Solvox] ${categoryLabel} · ${rating}/5`;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(EMAIL)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(draft)}`;
  const whatsappUrl = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(draft)}`;

  const openDraft = (event, channel) => {
    if (!message.trim()) {
      event.preventDefault();
      setError(english ? 'Write your message first.' : 'Tulis pesanmu terlebih dahulu.');
      document.getElementById('feedback-comment')?.focus();
      return;
    }
    setError('');
    setOpened(channel);
  };

  return (
    <div className={`modal-backdrop utility-dialog-backdrop${closing ? ' is-closing' : ''}`} onMouseDown={(event) => { if (event.target === event.currentTarget) dismiss(); }}>
      <div ref={dialogRef} className="feedback-card" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
        <div className="utility-art-modal-head feedback-head">
          <div>
            <div className="eyebrow">{t('feedback')}</div>
            <h2 id="feedback-title">{english ? 'Send us your feedback' : 'Sampaikan masukanmu'}</h2>
            <p className="feedback-intro">{english ? 'Tell us what works or what we can improve. Choose how to contact us below.' : 'Ceritakan pengalamanmu, saran, atau kendala yang kamu temui. Pilih cara menghubungi kami di bawah.'}</p>
          </div>
          <button className="dialog-icon-close" type="button" onClick={dismiss} aria-label={t('close')}><PixelIcon name="close" size={18} /></button>
        </div>

        <div className="feedback-form">
          <fieldset className="feedback-field">
            <legend>{t('feedbackCategory')}</legend>
            <div className="feedback-category">{categories.map(([id, label]) => <button key={id} type="button" className={category === id ? 'active' : ''} aria-pressed={category === id} onClick={() => setCategory(id)}>{label}</button>)}</div>
          </fieldset>

          <fieldset className="feedback-field">
            <legend>{t('rating')}</legend>
            <div className="feedback-rating-row">
              <div className="stars">{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} onClick={() => setRating(value)} className={value <= rating ? 'on' : ''} aria-label={`${value} / 5`} aria-pressed={rating === value}>★</button>)}</div>
              <span className="feedback-rating-value" aria-live="polite">{rating} / 5</span>
            </div>
          </fieldset>

          <div className="feedback-field">
            <label htmlFor="feedback-comment">{english ? 'Your message' : 'Pesan kamu'} <span className="feedback-required">*</span></label>
            <textarea id="feedback-comment" required maxLength={2000} value={message} onChange={(event) => { setMessage(event.target.value); if (error) setError(''); }} placeholder={t('tellImprove')} rows={5} aria-describedby="feedback-hint" />
            <div className="feedback-input-meta"><span id="feedback-hint">{english ? 'Your message will be added to the email or WhatsApp draft.' : 'Pesan ini akan dimasukkan ke draf email atau WhatsApp.'}</span><span>{message.length}/2000</span></div>
          </div>
          {error && <p className="feedback-send-error" role="alert">{error}</p>}
        </div>

        <div className="feedback-delivery">
          <p className="feedback-delivery-title">{english ? 'Send via' : 'Kirim melalui'}</p>
          <div className="feedback-contact-options">
            <a className="feedback-contact-option" href={gmailUrl} target="_blank" rel="noopener noreferrer" onClick={(event) => openDraft(event, 'gmail')}>
              <span className="feedback-contact-icon"><PixelIcon name="mail" size={22} /></span>
              <span className="feedback-contact-copy"><strong>Gmail</strong><small>{EMAIL}</small></span>
              <PixelIcon name="right" size={17} className="feedback-contact-arrow" />
            </a>
            <a className="feedback-contact-option feedback-contact-option--wa" href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={(event) => openDraft(event, 'whatsapp')}>
              <span className="feedback-contact-icon"><PixelIcon name="feedback" size={22} /></span>
              <span className="feedback-contact-copy"><strong>WhatsApp</strong><small>0821 6293 4592</small></span>
              <PixelIcon name="right" size={17} className="feedback-contact-arrow" />
            </a>
          </div>
          <p className="feedback-delivery-note" role="status">{opened ? (english ? 'Draft opened. Press Send in Gmail or WhatsApp to deliver your message.' : 'Draf sudah dibuka. Tekan Kirim di Gmail atau WhatsApp agar pesan sampai.') : (english ? 'The draft opens in a new tab. Review it and press Send there.' : 'Draf akan terbuka di tab baru. Periksa lalu tekan Kirim di sana.')}</p>
        </div>
      </div>
    </div>
  );
}

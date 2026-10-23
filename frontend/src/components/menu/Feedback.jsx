import React,{useState} from 'react';
import {sendFeedback} from '../../services/feedback';
import PixelIcon from '../shared/PixelIcon';
import { SolvoxUtilityArt } from '../shared/SolvoxUtilityArt';
import useDialogKeyboard from '../shared/useDialogKeyboard';
import useAnimatedDismiss from '../shared/useAnimatedDismiss';

export default function Feedback({onClose,lang,t}){
  const {closing,dismiss}=useAnimatedDismiss(onClose);
  const dialogRef=useDialogKeyboard(dismiss);
  const [rating,setRating]=useState(5),[category,setCategory]=useState('pedagogy'),[text,setText]=useState(''),[sent,setSent]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState('');
  const categories=[['pedagogy',t('feedbackCategoryPedagogy')],['gameplay',t('feedbackCategoryGameplay')],['ui',t('feedbackCategoryUI')],['bug',t('feedbackCategoryBug')]];
  const submit=async()=>{setLoading(true);setError('');try{await sendFeedback({rating,category,comment:text,lang,ts:new Date().toISOString()});setSent(true)}catch{setSent(false);setError(lang==='en'?'Feedback could not be sent. Please try again.':'Feedback belum terkirim. Silakan coba lagi.')}finally{setLoading(false)}};
  return <div className={`modal-backdrop utility-dialog-backdrop${closing?' is-closing':''}`} onMouseDown={(event)=>{if(event.target===event.currentTarget)dismiss()}}><div ref={dialogRef} className="feedback-card" role="dialog" aria-modal="true" aria-labelledby="feedback-title" aria-busy={loading}>
    <div className="utility-art-modal-head feedback-head"><div><div className="eyebrow">{t('feedback')}</div><h2 id="feedback-title">{t('experience')}</h2></div><button className="dialog-icon-close" type="button" onClick={()=>dismiss()} aria-label={t('close')}><PixelIcon name="close" size={18}/></button></div>
    <fieldset className="feedback-field" disabled={loading||sent}>
      <legend>{t('feedbackCategory')}</legend>
      <div className="feedback-category">{categories.map(([id,label])=><button key={id} type="button" className={category===id?'active':''} aria-pressed={category===id} onClick={()=>setCategory(id)}>{label}</button>)}</div>
    </fieldset>
    <fieldset className="feedback-field" disabled={loading||sent}>
      <legend>{t('rating')}</legend>
      <div className="feedback-rating-row">
        <div className="stars">{[1,2,3,4,5].map(x=><button type="button" key={x} onClick={()=>setRating(x)} className={x<=rating?'on':''} aria-label={`${x} / 5`} aria-pressed={rating===x}>★</button>)}</div>
        <span className="feedback-rating-value" aria-live="polite">{rating} / 5</span>
      </div>
    </fieldset>
    <div className="feedback-field">
      <label htmlFor="feedback-comment">{lang==='en'?'Your message':'Pesan kamu'}</label>
      <textarea id="feedback-comment" disabled={loading||sent} value={text} onChange={e=>setText(e.target.value)} placeholder={t('tellImprove')}/>
    </div>
    {error&&<p className="feedback-send-error" role="alert">{error}</p>}
    {sent&&<div className="success" role="status"><PixelIcon name="check" size={16}/><span>{t('thanks')}</span></div>}
    <div className="feedback-actions">
      <button className="secondary-btn feedback-close-btn" type="button" onClick={()=>dismiss()}><SolvoxUtilityArt name="close" size={18} className="feedback-close-art" /><span>{t('close')}</span></button>
      {!sent&&<button type="button" disabled={loading} className="primary-btn" onClick={submit}>{loading?t('saving'):t('sendFeedback')}</button>}
    </div>
  </div></div>
}

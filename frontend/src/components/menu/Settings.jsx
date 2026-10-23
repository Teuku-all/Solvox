import React,{useEffect,useState} from 'react';
import PixelIcon from '../shared/PixelIcon';
import {SolvoxUtilityArt} from '../shared/SolvoxUtilityArt';
import { isSoundEnabled, setSoundEnabled } from '../../services/sound';
import useDialogKeyboard from '../shared/useDialogKeyboard';
import useAnimatedDismiss from '../shared/useAnimatedDismiss';

export default function Settings({lang,t,onClose,onReset,onChangeLang,onAboutUs}){
  const {closing,dismiss}=useAnimatedDismiss(onClose);
  const dialogRef=useDialogKeyboard(dismiss);
  const [motion,setMotion]=useState(()=>localStorage.getItem('solvox.reducedMotion')==='1' || localStorage.getItem('numericore.reducedMotion')==='1' || localStorage.getItem('aljabarmaster.reducedMotion')==='1');
  const [sound,setSound]=useState(()=>isSoundEnabled());
  useEffect(()=>{document.documentElement.classList.toggle('reduced-motion',motion);localStorage.setItem('solvox.reducedMotion',motion?'1':'0')},[motion]);
  const chooseLanguage=(next)=>{onChangeLang?.(next)};
  return <div className={`modal-backdrop utility-dialog-backdrop${closing?' is-closing':''}`} onMouseDown={(event)=>{if(event.target===event.currentTarget)dismiss()}}>
    <div ref={dialogRef} className="settings-card" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="utility-art-modal-head settings-head--legacy settings-head">
        <img src="/assets/ui/utility/icons/settings-v101.webp" alt="" aria-hidden="true" className="settings-head-art" />
        <div><div className="eyebrow">{t('settings')}</div><h2 id="settings-title">{t('settingsTitle')}</h2></div>
        <button className="dialog-icon-close" type="button" onClick={()=>dismiss()} aria-label={t('close')}><PixelIcon name="close" size={18}/></button>
      </div>

      <div className="settings-row language-setting">
        <div><b>{t('language')}</b><p>{t('languageHint')}</p></div>
        <div className="language-switch--legacy language-switch" role="group" aria-label={t('language')}>
          <button type="button" className={lang==='id'?'active':''} onClick={()=>chooseLanguage('id')} aria-pressed={lang==='id'} aria-label={t('languageIndonesia')} title={t('languageIndonesia')}>
            <img src="/assets/ui/utility/icons/flag-id-v94.png" alt="" aria-hidden="true" />
            <span>Indonesia</span>
          </button>
          <button type="button" className={lang==='en'?'active':''} onClick={()=>chooseLanguage('en')} aria-pressed={lang==='en'} aria-label={t('languageEnglish')} title={t('languageEnglish')}>
            <img src="/assets/ui/utility/icons/flag-en-v94.png" alt="" aria-hidden="true" />
            <span>English</span>
          </button>
        </div>
      </div>

      <div className="settings-row">
        <div><b>{t('sound')}</b><p>{t('soundHint')}</p></div>
        <button type="button" role="switch" aria-checked={sound} aria-label={t('sound')} className={`toggle-btn ${sound?'on':''}`} onClick={()=>setSound(v=>{const next=!v;setSoundEnabled(next);return next;})}>{sound?t('on'):t('off')}</button>
      </div>

      <div className="settings-row">
        <div><b>{t('reducedMotion')}</b><p>{t('motionHint')}</p></div>
        <button type="button" role="switch" aria-checked={motion} aria-label={t('reducedMotion')} className={`toggle-btn ${motion?'on':''}`} onClick={()=>setMotion(v=>!v)}>{motion?t('on'):t('off')}</button>
      </div>

      <div className="settings-row settings-about-row">
        <div><b>{t('aboutUs')}</b><p>{t('aboutUsHint')}</p></div>
        <button className="secondary-btn settings-about-btn" type="button" onClick={()=>dismiss(onAboutUs)}>{t('openAboutUs')}</button>
      </div>

      <div className="settings-row danger">
        <div><b>{t('resetTitle')}</b><p>{t('resetDesc')}</p></div>
        <button className="danger-btn" onClick={onReset}><PixelIcon name="reset" size={14}/><span>{t('reset')}</span></button>
      </div>
      <button className="primary-btn settings-close settings-close-btn" onClick={()=>dismiss()}><SolvoxUtilityArt name="close" size={18} className="settings-close-art" /><span>{t('close')}</span></button>
    </div>
  </div>
}

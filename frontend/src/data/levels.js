export const LEVELS = [
  { id:1, chapter:'CHAPTER 1', chapterEn:'CHAPTER 1', title:'Gerbang Kesetaraan', titleEn:'Balance Gate', difficulty:'Pemula', difficultyEn:'Beginner', theme:'algebra', accent:'#4de7ff', art:'/assets/ui/chapters/chapter-1.webp' },
  { id:2, chapter:'CHAPTER 2', chapterEn:'CHAPTER 2', title:'Pabrik Pengali', titleEn:'Multiplier Factory', difficulty:'Menengah', difficultyEn:'Intermediate', theme:'multiply', accent:'#8b7cff', art:'/assets/ui/chapters/chapter-2.webp' },
  { id:3, chapter:'CHAPTER 3', chapterEn:'CHAPTER 3', title:'Ruang Persamaan', titleEn:'Equation Chamber', difficulty:'Lanjutan', difficultyEn:'Advanced', theme:'equation', accent:'#ffb86b', art:'/assets/ui/chapters/chapter-3.webp' },
  { id:4, chapter:'CHAPTER 4', chapterEn:'CHAPTER 4', title:'Kuil Pecahan', titleEn:'Fraction Temple', difficulty:'Sulit', difficultyEn:'Advanced', theme:'fraction', accent:'#ff7bcb', art:'/assets/ui/chapters/chapter-4.webp' },
  { id:5, chapter:'CHAPTER 5', chapterEn:'CHAPTER 5', title:'Benteng Bayangan', titleEn:'Shadow Fortress', difficulty:'Boss', difficultyEn:'Boss', theme:'mixed', accent:'#b55cff', art:'/assets/ui/chapters/chapter-5.webp' }
];

export function isLocalDevelopment(){
  if(import.meta.env.DEV)return true;
  const host=window.location.hostname.toLowerCase();
  return host==='localhost'||host==='::1'||host.endsWith('.localhost')||/^127(?:\.\d{1,3}){3}$/.test(host);
}

export function isUnlocked(progress, levelId){
  const chapterId=Number(levelId);
  if(!Number.isInteger(chapterId)||chapterId<1||chapterId>LEVELS.length)return false;
  if(isLocalDevelopment())return true;
  const p = new Set((progress?.completedLevels||[]).map(Number));
  return chapterId===1 || p.has(chapterId-1);
}

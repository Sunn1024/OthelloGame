import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Animated, Easing,
  Dimensions,
} from 'react-native';

// ═══════════════════════════════════════════════════════════════
//  THEME — Neon Cyberpunk
// ═══════════════════════════════════════════════════════════════
const T = {
  bg:         '#0d0d1a',
  bgCard:     '#111128',
  bgBoard:    '#0a1628',
  cellColor:  '#0d1f3c',
  cellBorder: '#0a1830',
  neonBlue:   '#00d4ff',
  neonPink:   '#ff2d78',
  neonGreen:  '#00ff9f',
  neonYellow: '#ffe600',
  text:       '#e0e8ff',
  textDim:    '#5a6a8a',
  black:      '#080818',
  white:      '#e8f0ff',
  validBg:    '#0d2e40',
};

const { width: SW } = Dimensions.get('window');
const CELL = Math.floor((SW - 48) / 8);   // responsive cell size

// ═══════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════
const BOARD_SIZE = 8;
const EMPTY = null;
const BLACK = 'black';
const WHITE = 'white';
const DIRECTIONS = [
  [-1,-1],[-1,0],[-1,1],
  [0,-1],        [0,1],
  [1,-1],[1,0],  [1,1],
];
const TIERS = [
  { name:'Bronze',   min:0,    max:299,      icon:'🥉', color:'#cd7f32' },
  { name:'Silver',   min:300,  max:699,      icon:'🥈', color:'#a8a8a8' },
  { name:'Gold',     min:700,  max:1199,     icon:'🥇', color:'#ffd700' },
  { name:'Platinum', min:1200, max:1799,     icon:'💎', color:'#a0e0e0' },
  { name:'Diamond',  min:1800, max:Infinity, icon:'💠', color:'#00d4ff' },
];
const INDIAN_NAMES = [
  'Arjun','Vikram','Priya','Rohan','Kavya','Rahul','Sneha','Amit',
  'Pooja','Kiran','Suresh','Anjali','Deepak','Meera','Rajesh',
  'Divya','Sanjay','Nisha','Aakash','Lakshmi','Gaurav','Ritu',
];
const WEIGHT_TABLE = [
  [100,-20,10,5,5,10,-20,100],
  [-20,-50,-2,-2,-2,-2,-50,-20],
  [10,-2,5,1,1,5,-2,10],
  [5,-2,1,0,0,1,-2,5],
  [5,-2,1,0,0,1,-2,5],
  [10,-2,5,1,1,5,-2,10],
  [-20,-50,-2,-2,-2,-2,-50,-20],
  [100,-20,10,5,5,10,-20,100],
];

// ═══════════════════════════════════════════════════════════════
//  SOUND ENGINE  (expo-av)
// ═══════════════════════════════════════════════════════════════
// We synthesise tones via a tiny base64 WAV generator
// so no asset files are needed.
function makeToneWav(freq=440, dur=0.15, vol=0.4) {
  const sr = 22050, n = Math.floor(sr*dur);
  const buf = new ArrayBuffer(44 + n*2);
  const view = new DataView(buf);
  const wr = (o,v,b=1)=>{ for(let i=0;i<b;i++) view.setUint8(o+i,(v>>(8*i))&0xff); };
  // WAV header
  [0x52,0x49,0x46,0x46].forEach((b,i)=>view.setUint8(i,b));
  view.setUint32(4,36+n*2,true);
  [0x57,0x41,0x56,0x45,0x66,0x6d,0x74,0x20].forEach((b,i)=>view.setUint8(8+i,b));
  view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true);
  view.setUint32(24,sr,true); view.setUint32(28,sr*2,true);
  view.setUint16(32,2,true); view.setUint16(34,16,true);
  [0x64,0x61,0x74,0x61].forEach((b,i)=>view.setUint8(36+i,b));
  view.setUint32(40,n*2,true);
  for(let i=0;i<n;i++){
    const env = i<sr*0.01 ? i/(sr*0.01) : Math.exp(-3*(i-sr*0.01)/(n-sr*0.01));
    const s = Math.sin(2*Math.PI*freq*i/sr)*vol*env*32767;
    view.setInt16(44+i*2,s,true);
  }
  const bytes = new Uint8Array(buf);
  let b64=''; bytes.forEach(b=>b64+=String.fromCharCode(b));
  return 'data:audio/wav;base64,'+btoa(b64);
}

const SOUNDS = {
  place: makeToneWav(600,0.1,0.3),
  flip:  makeToneWav(440,0.08,0.2),
  win:   makeToneWav(880,0.4,0.5),
  lose:  makeToneWav(220,0.5,0.4),
};

async function playSound(key) {
  try {
    const { sound } = await Audio.Sound.createAsync({ uri: SOUNDS[key] });
    await sound.playAsync();
    setTimeout(()=>sound.unloadAsync(), 2000);
  } catch(_) {}
}

// ═══════════════════════════════════════════════════════════════
//  GAME LOGIC
// ═══════════════════════════════════════════════════════════════
function createInitialBoard() {
  const b = Array(BOARD_SIZE).fill(null).map(()=>Array(BOARD_SIZE).fill(EMPTY));
  b[3][3]=WHITE; b[3][4]=BLACK; b[4][3]=BLACK; b[4][4]=WHITE;
  return b;
}
const opp = c => c===BLACK ? WHITE : BLACK;

function getFlips(board,row,col,color) {
  if(board[row][col]!==EMPTY) return [];
  const flips=[];
  for(const [dr,dc] of DIRECTIONS){
    const line=[]; let r=row+dr,c=col+dc;
    while(r>=0&&r<BOARD_SIZE&&c>=0&&c<BOARD_SIZE&&board[r][c]===opp(color)){
      line.push([r,c]); r+=dr; c+=dc;
    }
    if(line.length>0&&r>=0&&r<BOARD_SIZE&&c>=0&&c<BOARD_SIZE&&board[r][c]===color)
      flips.push(...line);
  }
  return flips;
}
const isValidMove=(b,r,c,color)=>getFlips(b,r,c,color).length>0;
function getAllValidMoves(board,color){
  const m=[];
  for(let r=0;r<BOARD_SIZE;r++) for(let c=0;c<BOARD_SIZE;c++)
    if(isValidMove(board,r,c,color)) m.push([r,c]);
  return m;
}
function applyMove(board,row,col,color){
  const nb=board.map(r=>[...r]);
  getFlips(nb,row,col,color).forEach(([r,c])=>nb[r][c]=color);
  nb[row][col]=color; return nb;
}
function countPieces(board){
  let black=0,white=0;
  for(const row of board) for(const cell of row){
    if(cell===BLACK) black++; if(cell===WHITE) white++;
  }
  return {black,white};
}

// ═══════════════════════════════════════════════════════════════
//  BOT AI
// ═══════════════════════════════════════════════════════════════
function getBotMove(board,difficulty){
  const moves=getAllValidMoves(board,WHITE);
  if(!moves.length) return null;
  if(difficulty==='easy') return moves[Math.floor(Math.random()*moves.length)];
  if(difficulty==='medium')
    return moves.reduce((b,m)=>getFlips(board,m[0],m[1],WHITE).length>getFlips(board,b[0],b[1],WHITE).length?m:b);
  return moves.reduce((b,m)=>{
    const s=WEIGHT_TABLE[m[0]][m[1]]+getFlips(board,m[0],m[1],WHITE).length*0.5;
    const bs=WEIGHT_TABLE[b[0]][b[1]]+getFlips(board,b[0],b[1],WHITE).length*0.5;
    return s>bs?m:b;
  });
}

// ═══════════════════════════════════════════════════════════════
//  RANKING
// ═══════════════════════════════════════════════════════════════
const getTier=pts=>TIERS.find(t=>pts>=t.min&&pts<=t.max)||TIERS[0];
function calcPointsChange(myPts,oppPts,won,myScore,oppScore){
  const margin=Math.abs(myScore-oppScore);
  const base=20, bonus=Math.floor(margin/4);
  const diff=Math.floor((oppPts-myPts)/100);
  return Math.max(5,Math.min(60,base+bonus+(won?diff:0)));
}

// ═══════════════════════════════════════════════════════════════
//  MATCHMAKING
// ═══════════════════════════════════════════════════════════════
function generateOnlinePlayers(myPts){
  if(Math.random()<0.3) return [];
  return Array.from({length:Math.floor(Math.random()*3)+1},(_,i)=>{
    const pts=Math.max(0,Math.round(myPts+(Math.random()-0.5)*400));
    return {id:i,name:INDIAN_NAMES[Math.floor(Math.random()*INDIAN_NAMES.length)],points:pts,tier:getTier(pts)};
  });
}
function findBestMatch(players,myPts){
  if(!players.length) return null;
  return players.reduce((b,p)=>Math.abs(p.points-myPts)<Math.abs(b.points-myPts)?p:b);
}

// ═══════════════════════════════════════════════════════════════
//  CONFETTI COMPONENT
// ═══════════════════════════════════════════════════════════════
const CONFETTI_COLORS=['#ff2d78','#00d4ff','#ffe600','#00ff9f','#bf5fff','#ff8800'];
function Confetti(){
  const pieces = useRef(
    Array.from({length:40},(_,i)=>({
      x:new Animated.Value(Math.random()*SW),
      y:new Animated.Value(-20),
      r:new Animated.Value(0),
      color:CONFETTI_COLORS[i%CONFETTI_COLORS.length],
      size:6+Math.random()*8,
      delay:Math.random()*600,
    }))
  ).current;

  useEffect(()=>{
    pieces.forEach(p=>{
      Animated.parallel([
        Animated.timing(p.y,{toValue:700,duration:1800+Math.random()*800,delay:p.delay,useNativeDriver:true,easing:Easing.linear}),
        Animated.timing(p.r,{toValue:720,duration:2000,delay:p.delay,useNativeDriver:true}),
      ]).start();
    });
  },[]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p,i)=>(
        <Animated.View key={i} style={{
          position:'absolute', left:p.x,
          width:p.size, height:p.size, borderRadius:p.size/4,
          backgroundColor:p.color,
          transform:[{translateY:p.y},{rotate:p.r.interpolate({inputRange:[0,720],outputRange:['0deg','720deg']})}],
        }}/>
      ))}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ANIMATED PIECE
// ═══════════════════════════════════════════════════════════════
function AnimatedPiece({color, isNew, isFlipped}){
  const scale = useRef(new Animated.Value(isNew?0:1)).current;
  const rotateY = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    if(isNew){
      Animated.spring(scale,{toValue:1,friction:5,tension:120,useNativeDriver:true}).start();
    }
  },[isNew]);

  useEffect(()=>{
    if(isFlipped){
      Animated.sequence([
        Animated.timing(rotateY,{toValue:1,duration:150,useNativeDriver:true,easing:Easing.linear}),
        Animated.timing(rotateY,{toValue:0,duration:150,useNativeDriver:true,easing:Easing.linear}),
      ]).start();
    }
  },[isFlipped]);

  const spin = rotateY.interpolate({inputRange:[0,1],outputRange:['1','0.05']});
  const isBlack = color===BLACK;

  return (
    <Animated.View style={{
      width:CELL-8, height:CELL-8, borderRadius:(CELL-8)/2,
      backgroundColor: isBlack ? T.black : T.white,
      borderWidth:1.5,
      borderColor: isBlack ? T.neonBlue : T.neonPink,
      transform:[{scale},{scaleX:spin}],
      shadowColor: isBlack ? T.neonBlue : T.neonPink,
      shadowOpacity:0.8, shadowRadius:6, elevation:6,
    }}/>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PULSING HINT DOT
// ═══════════════════════════════════════════════════════════════
function PulsingDot(){
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(()=>{
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse,{toValue:1,duration:700,useNativeDriver:true}),
        Animated.timing(pulse,{toValue:0.4,duration:700,useNativeDriver:true}),
      ])
    ).start();
  },[]);
  return (
    <Animated.View style={{
      width:10,height:10,borderRadius:5,
      backgroundColor:T.neonGreen,
      opacity:pulse,
      shadowColor:T.neonGreen, shadowOpacity:1, shadowRadius:6,
    }}/>
  );
}

// ═══════════════════════════════════════════════════════════════
//  FADE TRANSITION WRAPPER
// ═══════════════════════════════════════════════════════════════
function FadeScreen({children}){
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(()=>{
    Animated.timing(fade,{toValue:1,duration:300,useNativeDriver:true}).start();
  },[]);
  return <Animated.View style={{flex:1,opacity:fade}}>{children}</Animated.View>;
}

// ═══════════════════════════════════════════════════════════════
//  NEON TEXT COMPONENT
// ═══════════════════════════════════════════════════════════════
function NeonText({children, color=T.neonBlue, size=32, style}){
  return (
    <Text style={[{
      color, fontSize:size, fontWeight:'bold',
      textShadowColor:color, textShadowRadius:10,
      textShadowOffset:{width:0,height:0},
    },style]}>{children}</Text>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SETUP SCREEN
// ═══════════════════════════════════════════════════════════════
function SetupScreen({onDone}){
  const [name,setName]=useState('');
  return (
    <FadeScreen>
      <View style={s.container}>
        <NeonText color={T.neonBlue} size={42}>♟ OTHELLO</NeonText>
        <Text style={[s.subtitle,{marginTop:8}]}>Enter your callsign to begin</Text>
        <TextInput
          style={s.input} placeholder="Your name..." placeholderTextColor={T.textDim}
          value={name} onChangeText={setName} maxLength={16}
        />
        {name.trim().length>=2&&(
          <TouchableOpacity style={s.neonBtn} onPress={()=>onDone(name.trim())}>
            <Text style={[s.neonBtnText,{color:T.neonBlue}]}>▶ ENTER THE GRID</Text>
          </TouchableOpacity>
        )}
      </View>
    </FadeScreen>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MENU SCREEN
// ═══════════════════════════════════════════════════════════════
function MenuScreen({playerName,playerPoints,matchHistory,onSelect}){
  const tier=getTier(playerPoints);
  return (
    <FadeScreen>
      <View style={s.container}>
        <NeonText color={T.neonBlue} size={36}>♟ OTHELLO</NeonText>
        <View style={s.profileCard}>
          <Text style={s.profileName}>👤 {playerName}</Text>
          <Text style={[s.tierBadge,{color:tier.color}]}>{tier.icon} {tier.name}</Text>
          <NeonText color={tier.color} size={20}>{playerPoints} pts</NeonText>
        </View>
        <View style={s.menuGrid}>
          {[
            {key:'pvp',  icon:'👥', label:'Player vs\nPlayer', color:T.neonGreen},
            {key:'bot',  icon:'🤖', label:'vs Bot',            color:T.neonPink},
            {key:'online',icon:'🌐',label:'Play\nOnline',      color:T.neonYellow},
            {key:'history',icon:'📊',label:`History\n(${matchHistory.length})`, color:T.neonBlue},
            {key:'privacy',icon:'🔒',label:'Privacy\nPolicy',  color:T.textDim},
          ].map(m=>(
            <TouchableOpacity key={m.key} style={[s.menuBtn,{borderColor:m.color+'55'}]} onPress={()=>onSelect(m.key)}>
              <Text style={s.menuIcon}>{m.icon}</Text>
              <Text style={[s.menuLabel,{color:m.color}]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </FadeScreen>
  );
}

// ═══════════════════════════════════════════════════════════════
//  DIFFICULTY SCREEN
// ═══════════════════════════════════════════════════════════════
function DifficultyScreen({onSelect,onBack}){
  return (
    <FadeScreen>
      <View style={s.container}>
        <NeonText color={T.neonPink}>🤖 DIFFICULTY</NeonText>
        {['easy','medium','hard'].map(d=>(
          <TouchableOpacity key={d} style={s.diffRow} onPress={()=>onSelect(d)}>
            <Text style={s.diffIcon}>{d==='easy'?'🟢':d==='medium'?'🟡':'🔴'}</Text>
            <View>
              <Text style={s.diffLabel}>{d.toUpperCase()}</Text>
              <Text style={s.diffSub}>{d==='easy'?'Random moves':d==='medium'?'Greedy flips':'Position strategy'}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={{marginTop:16}} onPress={onBack}>
          <Text style={{color:T.textDim,fontSize:15}}>← Back</Text>
        </TouchableOpacity>
      </View>
    </FadeScreen>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MATCHMAKING SCREEN
// ═══════════════════════════════════════════════════════════════
function MatchmakingScreen({playerPoints,playerName,onMatchFound,onCancel}){
  const [phase,setPhase]=useState('searching');
  const [opponent,setOpponent]=useState(null);
  const [dots,setDots]=useState('');
  const spin=useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.loop(Animated.timing(spin,{toValue:1,duration:1200,useNativeDriver:true,easing:Easing.linear})).start();
    const dot=setInterval(()=>setDots(d=>d.length>=3?'':d+'.'),500);
    const t=setTimeout(()=>{
      clearInterval(dot);
      const pool=generateOnlinePlayers(playerPoints);
      const match=findBestMatch(pool,playerPoints);
      if(match){ setOpponent(match); setPhase('found'); setTimeout(()=>onMatchFound(match,'human'),1500); }
      else {
        const botName=INDIAN_NAMES[Math.floor(Math.random()*INDIAN_NAMES.length)];
        const botPts=Math.max(0,playerPoints+Math.round((Math.random()-0.5)*300));
        const bot={name:botName,points:botPts,tier:getTier(botPts),isBot:true};
        setOpponent(bot); setPhase('found'); setTimeout(()=>onMatchFound(bot,'bot'),1500);
      }
    },2500+Math.random()*1500);
    return()=>{clearTimeout(t);clearInterval(dot);};
  },[]);

  const spinAnim=spin.interpolate({inputRange:[0,1],outputRange:['0deg','360deg']});
  const tier=getTier(playerPoints);

  return (
    <FadeScreen>
      <View style={s.container}>
        <NeonText color={T.neonYellow}>🌐 MATCHMAKING</NeonText>
        <View style={s.profileCard}>
          <Text style={s.profileName}>{playerName}</Text>
          <Text style={[s.tierBadge,{color:tier.color}]}>{tier.icon} {tier.name} · {playerPoints} pts</Text>
        </View>
        {phase==='searching'&&(
          <>
            <Animated.Text style={{fontSize:48,transform:[{rotate:spinAnim}]}}>⚙️</Animated.Text>
            <NeonText color={T.neonGreen} size={18} style={{marginTop:12}}>Scanning for opponents{dots}</NeonText>
            <Text style={s.subtitle}>Prioritising players near your rank</Text>
            <TouchableOpacity style={{marginTop:24}} onPress={onCancel}>
              <Text style={{color:T.textDim,fontSize:15}}>✕ Cancel</Text>
            </TouchableOpacity>
          </>
        )}
        {phase==='found'&&opponent&&(
          <View style={[s.profileCard,{borderColor:T.neonYellow,marginTop:20}]}>
            <Text style={{color:T.neonYellow,fontSize:13,fontWeight:'700',marginBottom:6}}>
              {opponent.isBot?'⚠️ No players found — connecting to bot':'✅ Opponent Found!'}
            </Text>
            <NeonText color={T.neonPink} size={22}>{opponent.name}</NeonText>
            <Text style={[s.tierBadge,{color:opponent.tier.color}]}>{opponent.tier.icon} {opponent.tier.name} · {opponent.points} pts</Text>
            <Text style={{color:T.textDim,marginTop:8}}>Starting{dots}</Text>
          </View>
        )}
      </View>
    </FadeScreen>
  );
}

// ═══════════════════════════════════════════════════════════════
//  HISTORY SCREEN
// ═══════════════════════════════════════════════════════════════
function HistoryScreen({history,playerName,playerPoints,onBack}){
  const tier=getTier(playerPoints);
  return (
    <FadeScreen>
      <View style={s.container}>
        <NeonText color={T.neonBlue} size={26}>📊 MATCH LOG</NeonText>
        <View style={s.profileCard}>
          <Text style={s.profileName}>{playerName}</Text>
          <Text style={[s.tierBadge,{color:tier.color}]}>{tier.icon} {tier.name} · {playerPoints} pts</Text>
        </View>
        {!history.length
          ? <Text style={{color:T.textDim,marginTop:20}}>No matches yet. Get on the grid!</Text>
          : <ScrollView style={{width:'100%',paddingHorizontal:16,maxHeight:400}}>
              {[...history].reverse().map((h,i)=>(
                <View key={i} style={[s.histCard,h.won?s.histWon:s.histLost]}>
                  <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                    <Text style={{color:h.won?T.neonGreen:T.neonPink,fontWeight:'800',fontSize:14}}>{h.won?'🏆 WIN':'💀 LOSS'}</Text>
                    <Text style={{color:h.won?T.neonGreen:T.neonPink,fontWeight:'800'}}>{h.won?'+':'-'}{h.pointsDelta} pts</Text>
                  </View>
                  <Text style={{color:T.text,marginTop:4}}>vs {h.opponentName} <Text style={{color:h.opponentTier.color}}>{h.opponentTier.icon}{h.opponentTier.name}</Text>{h.isBot?' 🤖':''}</Text>
                  <Text style={{color:T.textDim,fontSize:12,marginTop:2}}>⚫ {h.myScore} — ⚪ {h.oppScore}</Text>
                </View>
              ))}
            </ScrollView>
        }
        <TouchableOpacity style={[s.neonBtn,{marginTop:16}]} onPress={onBack}>
          <Text style={[s.neonBtnText,{color:T.neonBlue}]}>← BACK</Text>
        </TouchableOpacity>
      </View>
    </FadeScreen>
  );
}

// ═══════════════════════════════════════════════════════════════
//  RESULT SCREEN
// ═══════════════════════════════════════════════════════════════
function ResultScreen({won,myScore,oppScore,pointsDelta,newPoints,opponent,onMenu,onPlayAgain}){
  const tier=getTier(newPoints);
  return (
    <FadeScreen>
      {won&&<Confetti/>}
      <View style={s.container}>
        <NeonText color={won?T.neonGreen:T.neonPink} size={52}>{won?'🏆':'💀'}</NeonText>
        <NeonText color={won?T.neonGreen:T.neonPink} size={36}>{won?'VICTORY!':'DEFEAT'}</NeonText>
        <Text style={s.subtitle}>vs {opponent?.name??'Opponent'}</Text>
        <View style={[s.profileCard,{marginTop:16,width:220}]}>
          <Text style={{color:T.text,fontSize:20,fontWeight:'bold'}}>⚫ {myScore}  —  ⚪ {oppScore}</Text>
          {isOnlineMode ? (
            <>
              <NeonText color={won?T.neonGreen:T.neonPink} size={26} style={{marginTop:8}}>
                {won?'+':'-'}{pointsDelta} pts
              </NeonText>
              <Text style={{color:T.textDim,marginTop:4}}>{newPoints} total</Text>
              <Text style={[s.tierBadge,{color:tier.color,fontSize:16,marginTop:4}]}>{tier.icon} {tier.name}</Text>
            </>
          ) : (
            <Text style={{color:T.textDim,marginTop:8,fontSize:12}}>
              🎮 Practice mode — no points at stake
            </Text>
          )}
        </View>
        <View style={{flexDirection:'row',gap:14,marginTop:24}}>
          <TouchableOpacity style={[s.neonBtn,{borderColor:T.textDim}]} onPress={onMenu}>
            <Text style={[s.neonBtnText,{color:T.textDim}]}>🏠 MENU</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.neonBtn} onPress={onPlayAgain}>
            <Text style={[s.neonBtnText,{color:T.neonBlue}]}>🔄 REMATCH</Text>
          </TouchableOpacity>
        </View>
      </View>
    </FadeScreen>
  );
}

// ═══════════════════════════════════════════════════════════════
//  GAME SCREEN
// ═══════════════════════════════════════════════════════════════
function GameScreen({mode,difficulty,opponent,playerName,playerPoints,onGameEnd,onMenu}){
  const [board,setBoard]=useState(createInitialBoard);
  const [turn,setTurn]=useState(BLACK);
  const [gameOver,setGameOver]=useState(false);
  const [botThinking,setBotThinking]=useState(false);
  // Track which cells are new or freshly flipped for animation
  const [newCell,setNewCell]=useState(null);
  const [flippedCells,setFlippedCells]=useState([]);

  const isBot=mode==='bot'||(mode==='online'&&opponent?.isBot);

  // ── Move timer ──
  useEffect(()=>{
    if(gameOver||botThinking) return;
    if(isBot&&turn===WHITE) return;   // don't run timer on bot's turn
    setTimeLeft(MOVE_TIME);
    timerRef.current = setInterval(()=>{
      setTimeLeft(t=>{
        if(t<=1){
          clearInterval(timerRef.current);
          // Time's up — auto pick a random valid move or forfeit
          const moves = getAllValidMoves(board, turn);
          if(moves.length>0){
            const [r,c]=moves[Math.floor(Math.random()*moves.length)];
            processMove(board,r,c,turn);
          }
          return MOVE_TIME;
        }
        return t-1;
      });
    },1000);
    return()=>clearInterval(timerRef.current);
  },[turn,gameOver,botThinking]);

  useEffect(()=>{
    if(!isBot||turn!==WHITE||gameOver) return;
    clearInterval(timerRef.current);
    setBotThinking(true);
    const diff=mode==='online'?'hard':difficulty;
    const t=setTimeout(()=>{
      const move=getBotMove(board,diff);
      if(move) processMove(board,move[0],move[1],WHITE);
      setBotThinking(false);
    },700);
    return()=>clearTimeout(t);
  },[turn,board]);

  function processMove(cur,row,col,color){
    const flips=getFlips(cur,row,col,color);
    const nb=applyMove(cur,row,col,color);
    setNewCell([row,col]);
    setFlippedCells(flips);
    playSound('place');
    if(flips.length>0) setTimeout(()=>playSound('flip'),120);
    const nx=opp(color);
    const nxM=getAllValidMoves(nb,nx);
    const curM=getAllValidMoves(nb,color);
    if(!nxM.length&&!curM.length){
      setBoard(nb); setGameOver(true);
      const {black,white}=countPieces(nb);
      const won=black>white;
      playSound(won?'win':'lose');
      setTimeout(()=>onGameEnd(won,black,white),800);
    } else if(!nxM.length){
      setBoard(nb);
    } else {
      setBoard(nb); setTurn(nx);
    }
    setTimeout(()=>{setNewCell(null);setFlippedCells([]);},400);
  }

  function handleCellPress(row,col){
    if(gameOver||botThinking) return;
    if(isBot&&turn===WHITE) return;
    if(!isValidMove(board,row,col,turn)) return;
    processMove(board,row,col,turn);
  }

  const validMoves=getAllValidMoves(board,turn);
  const isValid=(r,c)=>!gameOver&&validMoves.some(([vr,vc])=>vr===r&&vc===c);
  const {black,white}=countPieces(board);
  const isFlipped=(r,c)=>flippedCells.some(([fr,fc])=>fr===r&&fc===c);

  const p2Label=opponent?.name??(mode==='pvp'?'Player 2':'Bot');
  const myTier=getTier(playerPoints);
  const oppTier=opponent?getTier(opponent.points):null;

  const turnLabel=gameOver?'🏁 GAME OVER'
    :botThinking?`⚙️ ${p2Label} thinking...`
    :turn===BLACK?`⚫ ${playerName}'s Turn`
    :`⚪ ${p2Label}'s Turn`;

  return (
    <FadeScreen>
      <View style={s.container}>
        <NeonText color={T.neonBlue} size={22} style={{marginBottom:8}}>♟ OTHELLO</NeonText>

        {/* Score Row */}
        <View style={s.scoreRow}>
          {[
            {label:mode==='bot'?'⚫ You':`⚫ ${playerName}`, score:black, active:turn===BLACK, tier:myTier, color:T.neonBlue},
            {label:mode==='bot'?`🤖 ${p2Label}`:`⚪ ${p2Label}`, score:white, active:turn===WHITE, tier:oppTier, color:T.neonPink},
          ].map((p,i)=>(
            <View key={i} style={[s.scoreBox,p.active&&!gameOver&&{borderColor:p.color,shadowColor:p.color,shadowOpacity:0.6,shadowRadius:8,elevation:8}]}>
              <Text style={[s.scoreLabel,p.active&&{color:p.color}]}>{p.label}</Text>
              {mode==='online'&&p.tier&&<Text style={{color:p.tier.color,fontSize:10}}>{p.tier.icon}{p.tier.name}</Text>}
              <NeonText color={p.active?p.color:T.textDim} size={24}>{p.score}</NeonText>
            </View>
          ))}
        </View>

        <Text style={[s.turnText,{color:turn===BLACK?T.neonBlue:T.neonPink}]}>{turnLabel}</Text>

        {/* Move Timer — only show on human's turn */}
        {!gameOver&&!(isBot&&turn===WHITE)&&(
          <View style={[s.timerBox, timeLeft<=10&&{borderColor:T.neonPink}]}>
            <Text style={[s.timerText, timeLeft<=10&&{color:T.neonPink}]}>
              ⏱ {timeLeft}s
            </Text>
          </View>
        )}

        {/* Board */}
        <View style={[s.board,{width:CELL*8+4,height:CELL*8+4}]}>
          {board.map((row,ri)=>(
            <View key={ri} style={{flexDirection:'row'}}>
              {row.map((cell,ci)=>{
                const valid=isValid(ri,ci);
                return (
                  <TouchableOpacity
                    key={ci}
                    style={[s.cell,{width:CELL,height:CELL},valid&&{backgroundColor:T.validBg}]}
                    onPress={()=>handleCellPress(ri,ci)}
                    activeOpacity={valid?0.7:1}
                  >
                    {cell!==EMPTY&&(
                      <AnimatedPiece
                        color={cell}
                        isNew={newCell&&newCell[0]===ri&&newCell[1]===ci}
                        isFlipped={isFlipped(ri,ci)}
                      />
                    )}
                    {cell===EMPTY&&valid&&<PulsingDot/>}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <TouchableOpacity style={[s.neonBtn,{marginTop:16,borderColor:T.textDim}]} onPress={onMenu}>
          <Text style={[s.neonBtnText,{color:T.textDim}]}>🏠 MENU</Text>
        </TouchableOpacity>
      </View>
    </FadeScreen>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ROOT APP
// ═══════════════════════════════════════════════════════════════
export default function App(){
  const [screen,setScreen]       =useState('setup');
  const [playerName,setPlayerName]=useState('');
  const [playerPoints,setPoints]  =useState(100);
  const [matchHistory,setHistory] =useState([]);
  const [gameMode,setMode]        =useState(null);
  const [difficulty,setDiff]      =useState(null);
  const [opponent,setOpponent]    =useState(null);
  const [lastResult,setLastResult]=useState(null);

  const goMenu=()=>setScreen('menu');

  function handleSetupDone(name){ setPlayerName(name); setScreen('menu'); }

  function handleMenuSelect(c){
    if(c==='history'){setScreen('history');return;}
    if(c==='privacy'){setScreen('privacy');return;}
    if(c==='pvp'){setMode('pvp');setOpponent({name:'Player 2',points:playerPoints});setScreen('game');return;}
    if(c==='bot'){setMode('bot');setScreen('difficulty');return;}
    if(c==='online'){setMode('online');setScreen('matchmaking');return;}
  }

  function handleDiff(d){ setDiff(d); setOpponent({name:'Bot',points:playerPoints,isBot:true}); setScreen('game'); }

  function handleMatchFound(opp){ setOpponent(opp); setScreen('game'); }

  function handleGameEnd(won,myScore,oppScore){
    const isOnlineMode = gameMode === 'online';
    const delta = isOnlineMode
      ? calcPointsChange(playerPoints, opponent?.points??100, won, myScore, oppScore)
      : 0;
    const newPts = isOnlineMode
      ? Math.max(0, playerPoints + (won ? delta : -delta))
      : playerPoints;
    setHistory(h=>[...h,{won,myScore,oppScore,opponentName:opponent?.name??'Unknown',opponentTier:getTier(opponent?.points??100),pointsDelta:delta,isBot:opponent?.isBot??gameMode==='bot',isOnlineMode}]);
    setPoints(newPts);
    setLastResult({won,myScore,oppScore,pointsDelta:delta,newPoints:newPts,isOnlineMode});
    setScreen('result');
  }

  function handlePlayAgain(){
    if(gameMode==='online') setScreen('matchmaking');
    else if(gameMode==='bot') setScreen('difficulty');
    else setScreen('game');
  }

  if(screen==='setup')      return <SetupScreen onDone={handleSetupDone}/>;
  if(screen==='menu')       return <MenuScreen playerName={playerName} playerPoints={playerPoints} matchHistory={matchHistory} onSelect={handleMenuSelect}/>;
  if(screen==='history')    return <HistoryScreen history={matchHistory} playerName={playerName} playerPoints={playerPoints} onBack={goMenu}/>;
  if(screen==='privacy')    return <PrivacyScreen onBack={goMenu}/>;
  if(screen==='difficulty') return <DifficultyScreen onSelect={handleDiff} onBack={goMenu}/>;
  if(screen==='matchmaking')return <MatchmakingScreen playerPoints={playerPoints} playerName={playerName} onMatchFound={handleMatchFound} onCancel={goMenu}/>;
  if(screen==='game')       return <GameScreen mode={gameMode} difficulty={difficulty} opponent={opponent} playerName={playerName} playerPoints={playerPoints} onGameEnd={handleGameEnd} onMenu={goMenu}/>;
  if(screen==='result'&&lastResult) return <ResultScreen {...lastResult} opponent={opponent} onMenu={goMenu} onPlayAgain={handlePlayAgain}/>;
  return null;
}

// ═══════════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  container:   {flex:1,backgroundColor:T.bg,alignItems:'center',justifyContent:'center',padding:16},
  subtitle:    {color:T.textDim,fontSize:13,marginTop:4,textAlign:'center'},
  input:       {backgroundColor:T.bgCard,color:T.text,borderRadius:12,paddingHorizontal:20,paddingVertical:12,fontSize:17,width:240,textAlign:'center',borderWidth:1.5,borderColor:T.neonBlue+'55',marginBottom:20,marginTop:16},
  neonBtn:     {borderWidth:1.5,borderColor:T.neonBlue,borderRadius:24,paddingHorizontal:28,paddingVertical:10},
  neonBtnText: {fontSize:14,fontWeight:'800',letterSpacing:1},
  profileCard: {backgroundColor:T.bgCard,borderRadius:14,padding:14,alignItems:'center',marginBottom:12,borderWidth:1.5,borderColor:T.neonBlue+'33',width:200},
  profileName: {color:T.text,fontSize:17,fontWeight:'bold'},
  tierBadge:   {fontSize:13,fontWeight:'700',marginTop:2},
  menuGrid:    {flexDirection:'row',flexWrap:'wrap',gap:12,justifyContent:'center',maxWidth:290,marginTop:8},
  menuBtn:     {backgroundColor:T.bgCard,borderRadius:14,padding:16,alignItems:'center',width:128,borderWidth:1.5},
  menuIcon:    {fontSize:28,marginBottom:6},
  menuLabel:   {fontSize:12,fontWeight:'700',textAlign:'center'},
  diffRow:     {flexDirection:'row',alignItems:'center',gap:14,backgroundColor:T.bgCard,borderRadius:12,padding:16,marginBottom:10,width:260,borderWidth:1.5,borderColor:T.neonBlue+'33'},
  diffIcon:    {fontSize:26},
  diffLabel:   {color:T.text,fontSize:15,fontWeight:'800',letterSpacing:1},
  diffSub:     {color:T.textDim,fontSize:11,marginTop:2},
  scoreRow:    {flexDirection:'row',gap:12,marginBottom:8},
  scoreBox:    {alignItems:'center',paddingHorizontal:16,paddingVertical:8,borderRadius:12,borderWidth:1.5,borderColor:T.bgCard,backgroundColor:T.bgCard},
  scoreLabel:  {color:T.textDim,fontSize:12,fontWeight:'600'},
  turnText:    {fontSize:13,fontStyle:'italic',marginBottom:8,fontWeight:'600'},
  board:       {borderWidth:2,borderColor:T.neonBlue+'44',borderRadius:4,overflow:'hidden',backgroundColor:T.bgBoard},
  cell:        {backgroundColor:T.cellColor,borderWidth:0.5,borderColor:T.cellBorder,alignItems:'center',justifyContent:'center'},
  timerBox:    {borderWidth:1.5,borderColor:T.neonGreen,borderRadius:20,paddingHorizontal:20,paddingVertical:4,marginBottom:8},
  timerText:   {color:T.neonGreen,fontSize:15,fontWeight:'800',letterSpacing:1},
  histCard:    {borderRadius:10,padding:12,marginBottom:8,borderLeftWidth:3},
  histWon:     {backgroundColor:'#0d1f0d',borderLeftColor:T.neonGreen},
  histLost:    {backgroundColor:'#1f0d0d',borderLeftColor:T.neonPink},
});

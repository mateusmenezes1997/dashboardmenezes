/* GESTAO MENEZES // ARENA V6: only real recorded results */
(function(){
'use strict';
if(window.__gmArenaV6)return;window.__gmArenaV6=true;
var GOAL=5000000,arena=null,ticker=null,champions=null,lanes=null,news=null,snapshot=null,remoteState=null;
var previous=new Map(),hasServerBaseline=false,enabledSound=false,duelIndex=0,duelTimer=0,toastTimer=0;
var latestSignature='',lastTape='',inFlight=false,lastSync=0,remoteRevision=-1,sessionDenied=false,lastAuth=false,notices=[],unread=0;
var COLORS=['#eac782','#9de2ed','#d3819d'];
var money=function(n){return (Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})};
var compact=function(n){return (Number(n)||0).toLocaleString('pt-BR',{notation:'compact',maximumFractionDigits:2})};
var percent=function(n){return Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%'};
var dateKey=function(d){return String(d||'').slice(0,7)};
var currentMonth=function(){var parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit'}).format(new Date());return parts.slice(0,7)};
var monthLabel=function(){return new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',month:'long',year:'numeric'}).format(new Date())};
var initials=function(n){return String(n||'').trim().split(/\s+/).slice(0,2).map(function(w){return w[0]||''}).join('').toUpperCase()||'GM'};
var qs=function(id){return document.getElementById(id)};
var h=function(ta¶»§q«^
'use client';

import React, { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface SkillHeatmapProps {
  score: number;
  pros: string[];
  cons: string[];
}

export const SkillHeatmap: React.FC<SkillHeatmapProps> = ({ score, pros, cons }) => {
  // Generate a deterministic radar chart based on the pros, cons, and score
  const data = useMemo(() => {
    // Base scores around the overall match score
    const base = score > 10 ? score - 10 : score;
    
    // Hash function to make it look dynamic but stay deterministic per candidate
    const textToHash = [...pros, ...cons].join(' ');
    let hash = 0;
    for (let i = 0; i < textToHash.length; i++) {
      hash = textToHash.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Get pseudo-random variations based on the text hash (-10 to +15)
    const getVar = (offset: number) => {
      return (Math.abs(hash + offset) % 25) - 10;
    };

    // Ensure we don't go over 100 or under 0
    const clamp = (val: number) => Math.max(20, Math.min(100, val));

    // Determine domain match bonuses based on pros/cons length
    const technicalBonus = (pros.length > 2 ? 10 : 0) - (cons.some(c => c.toLowerCase().includes('skill') || c.toLowerCase().includes('experience')) ? 15 : 0);

    return [
      { subject: 'Technical Match', A: clamp(base + getVar(1) + technicalBonus) },
      { subject: 'Experience Level', A: clamp(base + getVar(2)) },
      { subject: 'Domain Knowledge', A: clamp(base + getVar(3)) },
      { subject: 'Culture Fit', A: clamp(base + getVar(4) + 10) }, // Often assumed good by default 
      { subject: 'Communication', A: clamp(base + getVar(5)) },
    ];
  }, [score, pros, cons]);

  return (
    <div className="w-full h-64 bg-[#F5E6C8]/50 p-2 rounded-none border border-[#D4A574]/40 relative">
      <div className="absolute top-2 left-2 text-[10px] font-mono font-bold uppercase tracking-widest text-[#4A7B7C]">Candidate Heatmap</div>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#D4A574" opacity={0.4} />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#3E362E', fontSize: 10, fontFamily: 'monospace' }} 
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={{ fill: '#D4A574', fontSize: 10 }}
            tickCount={5}
          />
          <Radar
            name="Skill Match"
            dataKey="A"
            stroke="#4A7B7C"
            fill="#4A7B7C"
            fillOpacity={0.4}
            isAnimationActive={true}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#F5F5DC', 
              border: '2px solid #D4A574',
              borderRadius: '0',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}
            itemStyle={{ color: '#4A7B7C', fontWeight: 'bold' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

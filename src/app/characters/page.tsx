'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { Shield, Heart, ChevronRight } from 'lucide-react';
import { Card, Badge, StatBlock, EmptyState } from '@/components/ui';
import * as api from '@/lib/api-client';
import { useTranslation } from '@/lib/i18n';
import { getAbilityModifier, formatModifier } from '@/lib/types';
import Link from 'next/link';

export default function CharactersPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const user = session?.user;
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const chars = await api.getMyCharacters();
        setCharacters(chars);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-1">{t.characters.yourCharacters}</h1>
      <p className="text-text-secondary text-sm mb-6">{t.characters.subtitle}</p>

      {characters.length === 0 ? (
        <EmptyState
          icon={<Shield className="w-12 h-12" />}
          title={t.characters.noCharacters}
          description={t.characters.noCharactersDesc}
          action={
            <Link href="/dashboard">
              <button className="mt-2 px-4 py-2 bg-accent text-surface-0 rounded-md text-sm font-medium hover:brightness-110 transition-all cursor-pointer">
                {t.characters.goToDashboard}
              </button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((char: any, i: number) => (
            <motion.div key={char.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link href={`/characters/${char.id}`}>
                <Card hover className="group">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium group-hover:text-accent transition-colors">{char.name}</h3>
                      <p className="text-xs text-text-tertiary">{char.race} {char.class} · {t.characters.level} {char.level}</p>
                      {char.campaign && (
                        <p className="text-[10px] text-accent/70 mt-0.5">�� {char.campaign.name}</p>
                      )}
                    </div>
                    <div className="flex gap-1.5 items-center">
                      <Badge variant="accent">{t.characters.ac} {char.armorClass}</Badge>
                      <Badge variant={(char.hp?.current || 0) > (char.hp?.max || 1) / 2 ? 'success' : 'danger'}>
                        <Heart className="w-3 h-3" /> {char.hp?.current || 0}/{char.hp?.max || 0}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-accent transition-colors" />
                    </div>
                  </div>

                  {char.abilityScores && (
                    <div className="grid grid-cols-6 gap-1">
                      {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map(ab => (
                        <StatBlock key={ab} label={ab.slice(0, 3).toUpperCase()} score={char.abilityScores[ab]} modifier={getAbilityModifier(char.abilityScores[ab])} />
                      ))}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-border flex items-center gap-4 text-xs text-text-tertiary">
                    <span>{t.characters.speed} {char.speed}ft</span>
                    <span>{t.characters.init} {formatModifier(char.initiative)}</span>
                    <span>{t.characters.prof} +{char.proficiencyBonus}</span>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

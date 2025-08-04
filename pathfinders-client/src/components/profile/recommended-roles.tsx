'use client';

import { useEffect, useState } from 'react';
import { RoleRecommendations } from '@/types/assessment';
import { assessmentApi } from '@/services/assessment';
import { Loading } from '@/components/ui/loading';
import { toast } from 'sonner';
import { 
  BookOpen, 
  Users, 
  Star, 
  Briefcase,
  GraduationCap,
  Heart,
  ChevronRight,
  LucideIcon
} from 'lucide-react';

interface RecommendedRolesProps {
  initialRoles?: RoleRecommendations;
}

export function RecommendedRoles({ initialRoles }: RecommendedRolesProps) {
  const [loading, setLoading] = useState(!initialRoles);
  const [roles, setRoles] = useState<RoleRecommendations | null>(initialRoles || null);

  useEffect(() => {
    if (!initialRoles) {
      async function fetchRoles() {
        try {
          const results = await assessmentApi.getLatestResults();
          if (results.recommended_roles) {
            setRoles(results.recommended_roles);
          }
        } catch (error) {
          console.error('Failed to fetch roles:', error);
          toast.error('Failed to load recommended roles');
        } finally {
          setLoading(false);
        }
      }
      fetchRoles();
    }
  }, [initialRoles]);

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loading size="default" />
      </div>
    );
  }

  if (!roles) return null;

  const roleIcons: Record<string, LucideIcon> = {
    'Bible Teacher': BookOpen,
    'Workshop Leader': Users,
    'Discipleship Coordinator': Star,
    'New Believers Instructor': GraduationCap,
    'Church Library Keeper': Briefcase,
    'Marriage Counselor': Heart,
    // Add more role-to-icon mappings as needed
  };

  return (
    <div className="space-y-6">
      {/* Primary Roles Section */}
      {roles.primary_roles?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
            <Star className="w-5 h-5 text-blue-600" />
            Primary Roles
          </h3>
          <div className="grid gap-3">
            {roles.primary_roles.map((role: string) => {
              const IconComponent = roleIcons[role] || Users;
              return (
                <div
                  key={role}
                  className="flex items-center gap-3 p-3.5 bg-[#f8fafc] 
                    rounded-lg hover:bg-[#f1f5f9] transition-colors group
                    border border-slate-200"
                >
                  <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100">
                    <IconComponent className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-[#0f172a] font-bold">{role}</span>
                  <ChevronRight className="w-4 h-4 text-slate-600 ml-auto" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Secondary Roles Section */}
      {roles.secondary_roles?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Secondary Roles
          </h3>
          <div className="grid gap-3">
            {roles.secondary_roles.map((role: string) => {
              const IconComponent = roleIcons[role] || Users;
              return (
                <div
                  key={role}
                  className="flex items-center gap-3 p-3.5 bg-[#f8fafc] 
                    rounded-lg hover:bg-[#f1f5f9] transition-colors group
                    border border-slate-200"
                >
                  <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100">
                    <IconComponent className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-[#0f172a] font-bold">{role}</span>
                  <ChevronRight className="w-4 h-4 text-slate-600 ml-auto" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ministry Areas Section */}
      {roles.ministry_areas?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            Ministry Areas
          </h3>
          <div className="flex flex-wrap gap-2">
            {roles.ministry_areas.map((area: string) => (
              <span 
                key={area}
                className="px-3.5 py-2 bg-[#f8fafc] text-[#0f172a] rounded-lg 
                  text-sm font-bold hover:bg-[#f1f5f9] transition-colors
                  border border-slate-200"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 
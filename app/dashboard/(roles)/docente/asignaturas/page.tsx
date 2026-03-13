'use client';

import { TablePagination } from '@/components/shared/table-pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCurrentPeriod, useTeacherSubjects } from '@/hooks/use-teacher-subjects';
import { BookOpen, Calendar, ChevronRight, GraduationCap, Hash } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SubjectsPage() {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedPeriod, setSelectedPeriod] = useState<string>(getCurrentPeriod());

  // Use React Query hook
  const { filteredSubjects, availablePeriods, isLoading, error } = useTeacherSubjects({
    period: selectedPeriod,
    enabled: true,
  });

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Reset to first page when period changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPeriod]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-card text-foreground flex items-center gap-2">
            Mis Asignaturas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Asignaturas asignadas en el período seleccionado.
          </p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3 bg-muted/30 px-3 py-1.5 rounded-2xl border border-transparent dark:border-white/[0.02]">
          <span className="text-[13px] font-medium text-muted-foreground whitespace-nowrap pl-1">
            Período:
          </span>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod} name="period">
            <SelectTrigger
              id="period-select"
              className="h-9 w-[140px] border-0 bg-transparent shadow-none hover:bg-muted/50 focus:ring-0 text-[13px] font-semibold"
            >
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-lg border-muted-foreground/10">
              {availablePeriods.map(period => (
                <SelectItem
                  key={period}
                  value={period}
                  className="text-[13px] font-medium rounded-lg"
                >
                  {period}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="p-0">
          {error && (
            <div className="p-4 mb-4 text-[13px] font-medium text-red-800 dark:text-red-300 bg-red-50/80 dark:bg-red-500/10 rounded-2xl">
              {error instanceof Error
                ? error.message
                : 'Ocurrió un error al cargar las asignaturas'}
            </div>
          )}

          <div className="bg-muted/30 dark:bg-white/[0.02] rounded-3xl p-1 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loading />
              </div>
            ) : filteredSubjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4 text-muted-foreground/50">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="text-[15px] font-semibold text-foreground mb-1">
                  Sin asignaturas en este período
                </h3>
                <div className="text-[13px] text-muted-foreground max-w-[280px]">
                  No tienes asignaturas asignadas para el período seleccionado.
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {filteredSubjects
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map(subject => (
                    <Link
                      key={subject.id}
                      href={`/dashboard/docente/asignaturas/${subject.id}`}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-5 hover:bg-muted/50 dark:hover:bg-white/[0.02] transition-colors focus-visible:outline-none focus-visible:bg-muted"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[15px] font-semibold text-foreground tracking-card group-hover:text-primary transition-colors">
                            {subject.name}
                          </span>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
                            <span className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-card font-bold opacity-80">
                              <Hash className="h-3 w-3" />
                              {subject.code}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span className="flex items-center gap-1 font-medium">
                              <GraduationCap className="h-3.5 w-3.5 opacity-70" />
                              {subject.program || 'N/A'}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span className="flex items-center gap-1 font-medium">
                              <Calendar className="h-3.5 w-3.5 opacity-70" />
                              Semestre {subject.semester || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full pl-14 sm:pl-0">
                        <div className="flex flex-col sm:items-end">
                          <span className="text-[14px] font-semibold sm:text-right text-foreground">
                            {subject.credits || '0'}
                          </span>
                          <span className="text-[11px] font-medium uppercase tracking-card text-muted-foreground">
                            Créditos
                          </span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-foreground/70 transition-colors shrink-0" />
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </div>
          {filteredSubjects.length > 0 && (
            <div className="border-t">
              <TablePagination
                currentPage={currentPage}
                totalItems={filteredSubjects.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

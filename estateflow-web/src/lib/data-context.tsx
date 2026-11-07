"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { describeDataError } from "./errors";
import { supabase } from "./supabase";
import { mapClient, mapProperty } from "./mappers";
import { useAuth } from "./auth";
import type { ClientRecord, PropertyRecord } from "./types";

interface DataContextValue {
  properties: PropertyRecord[] | null;
  clients: ClientRecord[] | null;
  propertiesLoading: boolean;
  clientsLoading: boolean;
  error: string | null;
  retry: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyRecord[] | null>(null);
  const [clients, setClients] = useState<ClientRecord[] | null>(null);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!user) {
      setProperties(null);
      setClients(null);
      setPropertiesLoading(true);
      setClientsLoading(true);
      return;
    }

    let active = true;
    setPropertiesLoading(true);
    setClientsLoading(true);
    setError(null);

    const userId = user.id;

    // Fetch properties
    async function fetchProperties() {
      try {
        const { data, error: fetchError } = await supabase
          .from("properties")
          .select("*")
          .eq("owner_id", userId)
          .order("name");
        if (fetchError) throw fetchError;
        if (!active) return;
        const next = (data || []).map((document) => mapProperty(document.id, document));
        setProperties(next);
        setPropertiesLoading(false);
      } catch (fetchError) {
        if (!active) return;
        setError(describeDataError(fetchError));
        setPropertiesLoading(false);
      }
    }

    // Fetch clients
    async function fetchClients() {
      try {
        const { data, error: fetchError } = await supabase
          .from("clients")
          .select("*")
          .eq("owner_id", userId)
          .order("name");
        if (fetchError) throw fetchError;
        if (!active) return;
        const next = (data || []).map((document) => mapClient(document.id, document));
        setClients(next);
        setClientsLoading(false);
      } catch (fetchError) {
        if (!active) return;
        setError(describeDataError(fetchError));
        setClientsLoading(false);
      }
    }

    void fetchProperties();
    void fetchClients();

    // Subscribe to real-time changes
    const propertiesChannel = supabase
      .channel("properties-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "properties", filter: `owner_id=eq.${userId}` },
        () => void fetchProperties(),
      )
      .subscribe();

    const clientsChannel = supabase
      .channel("clients-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clients", filter: `owner_id=eq.${userId}` },
        () => void fetchClients(),
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(propertiesChannel);
      void supabase.removeChannel(clientsChannel);
    };
  }, [user, attempt]);

  const retry = useCallback(() => {
    setProperties(null);
    setClients(null);
    setPropertiesLoading(true);
    setClientsLoading(true);
    setError(null);
    setAttempt((value) => value + 1);
  }, []);

  const value = useMemo(
    () => ({
      properties,
      clients,
      propertiesLoading,
      clientsLoading,
      error,
      retry,
    }),
    [properties, clients, propertiesLoading, clientsLoading, error, retry],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used inside <DataProvider>.");
  return context;
}
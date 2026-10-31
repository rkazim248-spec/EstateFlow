"use client";

import {
  collection,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { describeDataError } from "./errors";
import { getFirebase } from "./firebase";
import { CLIENTS_COLLECTION, PROPERTIES_COLLECTION } from "./data";
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
    const { db } = getFirebase();
    const unsubscribers: Unsubscribe[] = [];

    setPropertiesLoading(true);
    setClientsLoading(true);
    setError(null);

    unsubscribers.push(
      onSnapshot(
        collection(db, PROPERTIES_COLLECTION),
        (snapshot) => {
          if (!active) return;
          const next = snapshot.docs.map((document) =>
            mapProperty(document.id, document.data()),
          );
          setProperties(next);
          setPropertiesLoading(false);
        },
        (snapshotError) => {
          if (!active) return;
          setError(describeDataError(snapshotError));
          setPropertiesLoading(false);
        },
      ),
    );

    unsubscribers.push(
      onSnapshot(
        collection(db, CLIENTS_COLLECTION),
        (snapshot) => {
          if (!active) return;
          const next = snapshot.docs.map((document) =>
            mapClient(document.id, document.data()),
          );
          setClients(next);
          setClientsLoading(false);
        },
        (snapshotError) => {
          if (!active) return;
          setError(describeDataError(snapshotError));
          setClientsLoading(false);
        },
      ),
    );

    return () => {
      active = false;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
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

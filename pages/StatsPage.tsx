import React from 'react';
import { useStats } from '../hooks/useKgQueries';

interface StatsPageProps {
    darkMode: boolean;
}

export default function StatsPage({ darkMode }: StatsPageProps) {
    const { data: kgStats, isLoading } = useStats();

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
            <div className="max-w-4xl mx-auto">

                <div className="rounded-2xl shadow-sm border p-8 text-center transition-colors duration-300 bg-card border-border">
                    <div className="max-w-2xl mx-auto">
                        <div className="inline-block p-4 rounded-full mb-4 bg-muted">
                            <i className="fas fa-project-diagram text-4xl text-muted-foreground"></i>
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-foreground">Detailed Statistics</h2>
                        <p className="mb-8 text-muted-foreground">
                            The PrimeKG graph integrates 20 high-quality datasets to curate knowledge about 129,375 nodes, including 17,080 diseases, and over 8 million relationships.
                        </p>

                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                                {[
                                    { label: "Nodes", val: kgStats?.node_count?.toLocaleString() ?? "129,375", icon: "fa-project-diagram", color: "text-indigo-500" },
                                    { label: "Relationships", val: kgStats?.edge_count?.toLocaleString() ?? "8,100,498", icon: "fa-share-alt", color: "text-blue-500" },
                                    { label: "Diseases", val: kgStats?.disease_count?.toLocaleString() ?? "17,080", icon: "fa-virus", color: "text-red-500" },

                                    { label: "Data Sources", val: "20", icon: "fa-database", color: "text-emerald-500" },
                                    { label: "Biological Scales", val: "10+", icon: "fa-layer-group", color: "text-purple-500" },
                                    { label: "Genes", val: "18,000+", icon: "fa-dna", color: "text-pink-500" },
                                ].map((stat, i) => (
                                    <div key={i} className="p-6 rounded-xl border hover:shadow-md transition-shadow bg-card border-border">
                                        <div className={`text-2xl mb-2 ${stat.color}`}>
                                            <i className={`fas ${stat.icon}`}></i>
                                        </div>
                                        <div className="text-3xl font-bold text-foreground">{stat.val}</div>
                                        <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

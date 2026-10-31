import 'package:flutter/material.dart';

import '../../models/client.dart';
import '../../models/property.dart';
import '../../services/client_repository.dart';
import '../../services/property_repository.dart';
import '../../widgets/estateflow_logo.dart';
import '../../widgets/stat_card.dart';

/// Summary dashboard with live counts of properties and clients.
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({
    super.key,
    required this.onOpenProperties,
    required this.onOpenClients,
    this.propertyRepository,
    this.clientRepository,
  });

  final VoidCallback onOpenProperties;
  final VoidCallback onOpenClients;

  /// Overridable so the dashboard can be rendered without a live connection.
  final PropertyRepository? propertyRepository;
  final ClientRepository? clientRepository;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late final PropertyRepository _propertyRepository =
      widget.propertyRepository ?? PropertyRepository();
  late final ClientRepository _clientRepository =
      widget.clientRepository ?? ClientRepository();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            EstateFlowSymbol(size: 28),
            SizedBox(width: 10),
            Text('Dashboard'),
          ],
        ),
      ),
      body: StreamBuilder<List<Property>>(
        stream: _propertyRepository.watchAll(),
        builder: (context, propertiesSnapshot) {
          return StreamBuilder<List<Client>>(
            stream: _clientRepository.watchAll(),
            builder: (context, clientsSnapshot) {
              final properties = propertiesSnapshot.data ?? const <Property>[];
              final clients = clientsSnapshot.data ?? const <Client>[];
              final loading =
                  propertiesSnapshot.connectionState ==
                      ConnectionState.waiting ||
                  clientsSnapshot.connectionState == ConnectionState.waiting;

              final stats = <_Stat>[
                _Stat(
                  'Total Properties',
                  properties.length,
                  Icons.home_work_outlined,
                  widget.onOpenProperties,
                ),
                _Stat(
                  'Properties for Rent',
                  properties.where((p) => p.isForRent).length,
                  Icons.key_outlined,
                  widget.onOpenProperties,
                ),
                _Stat(
                  'Properties for Sale',
                  properties.where((p) => p.isForSale).length,
                  Icons.sell_outlined,
                  widget.onOpenProperties,
                ),
                _Stat(
                  'Total Clients',
                  clients.length,
                  Icons.people_outline,
                  widget.onOpenClients,
                ),
                _Stat(
                  'Clients Buying',
                  clients.where((c) => c.wantsToBuy).length,
                  Icons.shopping_bag_outlined,
                  widget.onOpenClients,
                ),
                _Stat(
                  'Clients Renting',
                  clients.where((c) => c.wantsToRent).length,
                  Icons.handshake_outlined,
                  widget.onOpenClients,
                ),
              ];

              if (loading) {
                return const Center(child: CircularProgressIndicator());
              }

              return LayoutBuilder(
                builder: (context, constraints) {
                  final width = constraints.maxWidth;
                  final columns = width >= 840
                      ? 4
                      : width >= 600
                      ? 3
                      : width >= 380
                      ? 2
                      : 1;

                  return GridView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: columns,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      // A fixed height keeps the tiles from overflowing once
                      // the label wraps onto a second line.
                      mainAxisExtent: 150,
                    ),
                    itemCount: stats.length,
                    itemBuilder: (context, index) {
                      final stat = stats[index];
                      return StatCard(
                        label: stat.label,
                        value: stat.value,
                        icon: stat.icon,
                        onTap: stat.onTap,
                      );
                    },
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}

class _Stat {
  const _Stat(this.label, this.value, this.icon, this.onTap);

  final String label;
  final int value;
  final IconData icon;
  final VoidCallback onTap;
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const speciesData = [
  {
    commonName: 'Ajo',
    scientificName: 'Allium sativum',
    waterRequirements: 'Riego moderado, evitar encharcamiento. Agua cuando el suelo esté seco en la superficie.',
    lightRequirements: 'Sol directo al menos 6-8 horas diarias. Prefiere luz intensa.',
    humidityRequirements: 'Baja humedad ambiental. Tolera bien ambientes secos.'
  },
  {
    commonName: 'Geranio',
    scientificName: 'Pelargonium',
    waterRequirements: 'Riego moderado. Dejar secar entre riegos. Reducir en invierno.',
    lightRequirements: 'Sol directo o semi-sombra. Mínimo 4-6 horas de luz.',
    humidityRequirements: 'Humedad media. No requiere humedad alta.'
  },
  {
    commonName: 'Hierbabuena',
    scientificName: 'Mentha spicata',
    waterRequirements: 'Riego abundante. Mantener suelo constantemente húmedo pero no encharcado.',
    lightRequirements: 'Semi-sombra o luz indirecta. Tolera algo de sol directo.',
    humidityRequirements: 'Alta humedad. Rociar hojas ocasionalmente.'
  },
  {
    commonName: 'Menta',
    scientificName: 'Mentha',
    waterRequirements: 'Riego abundante y frecuente. Necesita suelo húmedo.',
    lightRequirements: 'Semi-sombra preferida. Puede tolerar sol parcial.',
    humidityRequirements: 'Alta humedad ambiental. Beneficia de pulverización.'
  },
  {
    commonName: 'Orégano',
    scientificName: 'Origanum vulgare',
    waterRequirements: 'Riego bajo a moderado. Tolera sequía. Evitar exceso de agua.',
    lightRequirements: 'Sol directo pleno. Necesita mucha luz para desarrollar aroma.',
    humidityRequirements: 'Baja humedad. Prefiere ambientes secos tipo mediterráneo.'
  },
  {
    commonName: 'Orquídea',
    scientificName: 'Orchidaceae',
    waterRequirements: 'Riego moderado. Regar cuando las raíces se vean plateadas. Evitar encharcamiento.',
    lightRequirements: 'Luz indirecta brillante. Nunca sol directo que puede quemar hojas.',
    humidityRequirements: 'Alta humedad (50-70%). Rociar ambiente o usar bandeja con agua.'
  },
  {
    commonName: 'Rosa China',
    scientificName: 'Hibiscus rosa-sinensis',
    waterRequirements: 'Riego moderado a abundante. Mantener tierra húmeda en verano, reducir en invierno.',
    lightRequirements: 'Sol directo o semi-sombra. Al menos 6 horas de luz para florecer.',
    humidityRequirements: 'Humedad media a alta. Rociar hojas en ambientes secos.'
  },
  {
    commonName: 'Tomate Cherry',
    scientificName: 'Solanum lycopersicum var. cerasiforme',
    waterRequirements: 'Riego abundante y regular. Especialmente durante fructificación. Evitar mojar hojas.',
    lightRequirements: 'Sol directo pleno. Mínimo 8 horas diarias para buena producción.',
    humidityRequirements: 'Humedad media. Evitar exceso de humedad que favorece hongos.'
  }
];

async function seed() {
  console.log('🌱 Starting species seed...');
  
  try {
    for (const species of speciesData) {
      const result = await prisma.species.upsert({
        where: { 
          commonName_scientificName: {
            commonName: species.commonName,
            scientificName: species.scientificName
          }
        },
        update: species,
        create: species
      });
      
      console.log(`✓ ${result.commonName} (${result.scientificName})`);
    }
    
    console.log('\n✅ Seed completed successfully!');
    console.log(`📊 Total species: ${speciesData.length}`);
  } catch (error) {
    console.error('❌ Error seeding species:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

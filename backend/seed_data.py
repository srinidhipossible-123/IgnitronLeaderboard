import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
from passlib.context import CryptContext
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# Event names
EVENT_NAMES = [
    "Code Rush:Hackathon", "ModelQuest", "Capture The Flag", "Robo Race",
    "Tech Thesis", "E-Sports: Free Fire", "Nextwave-Paper Presentaion", "IgniteX Debate",
    "Market Mavericks", "Moot Court", "PixelCraft", "Ideathon",
    "Engineer's Eye", "Circuit Debugging", "Robo Sumo", "E-Sports : BGMI",
    "Food Tech", "Finovate", "Startathon", "Line Follower",
    "Coding Collab", "Poster Presentation", "Scrap Tech"
]

# College names
COLLEGE_NAMES = [
    "Chennai Institute of Technology",
    "Amrita Vishwa Vidyapeetham",
    "St Vincent Pallotti College of Engineering and Technology",
    "KIT College of Engineering, Kolhapur, Maharashtra",
    "Kolhapur Institute of Technology, Kolhapur",
    "Parul University (PU), Vadodara",
    "Vidyalankar Institute of Technology",
    "Tontadarya College of Engineering, Gadag",
    "KLE Engineering, Belgaum",
    "Rajeev Institute of Technology, Aduvalli, Karnataka",
    "Bapuji Institute of Engineering & Technology, Davangere",
    "PES Institute of Technology and Management, Shivamogga",
    "GM Institute of Technology (GMIT), Davangere",
    "Ballari Business College",
    "Ballari Institute of Technology & Management, Allipura, Ballari",
    "Visvesvaraya Technological University (VTU), Belagavi, Karnataka",
    "KLE Institute of Technology (KLEIT), Hubli",
    "KLE College of Engineering and Technology (KLECET), Chikodi, Karnataka",
    "KLS Gogte Institute of Technology, Belgaum, Karnataka",
    "Jawaharlal Nehru National College of Engineering (JNNCE), Shimoga, Karnataka",
    "Shri Dharmasthala Manjunatheshwara College of Engineering & Technology, Dharwad",
    "Alvas Institute Of Engineering And Technology",
    "Canara Engineering College, Bantwal",
    "Vidyavardhaka College of Engineering, Mysuru",
    "Jain College of Engineering & Technology, Hubballi",
    "Akshaya Institute Of Technology, Tumkur",
    "JSS Science and Technology University, Mysore",
    "MVJ College of Engineering, Bengaluru, Karnataka",
    "GSSS Institute of Engineering and Technology for Women (GSSSIETW), Mysore",
    "Smt Kamala And Sri Venkappa M. Agadi College of Engineering & Technology (SKSVAMCET), Wadeyar Mallapur, Karnataka",
    "Smt Kamala & Shri Venkappa Agadi College of Engineering, Laxmeshwar, Karnataka",
    "RNS Institute of Technology (RNSIT), Bengaluru",
    "Veerappa Nisty Engineering College, Shorapur (Yadgir)",
    "SDMCET",
    "Sri Jayachamarajendra College of Engineering, Mysore",
    "Jyothy Institute Of Technology",
    "R.V. College of Engineering (RVCE), Bangalore"
]


# Sample achievement statements for different events
ACHIEVEMENT_STATEMENTS = [
    "Won first place in the coding competition",
    "Secured second position with innovative solution",
    "Special recognition for best technical implementation",
    "Awarded for outstanding creativity and innovation",
    "Won the championship with perfect score",
    "Achieved excellence in project demonstration",
    "Recognized for best research paper",
    "Won the debate competition with compelling arguments",
    "Awarded for exceptional teamwork and coordination",
    "Achieved top score in technical quiz",
    "Won the gaming tournament with highest points",
    "Recognized for innovative robotics design",
    "Awarded for best IoT implementation",
    "Won cybersecurity challenge with zero vulnerabilities",
    "Achieved excellence in data analysis",
    "Recognized for best cloud architecture",
    "Won mobile app development competition",
    "Awarded for innovative blockchain solution",
    "Achieved first place in DevOps challenge",
    "Recognized for outstanding UI/UX design",
    "Won digital marketing strategy competition",
    "Awarded for best photography skills",
    "Won short film competition with creative storytelling",
    "Achieved excellence in technical dance performance"
]

async def seed_database():
    print("\n" + "="*60)
    print("IGNITRON 2K25 - Database Seeding")
    print("="*60 + "\n")
    
    # Clear existing data
    print("Clearing existing data...")
    await db.users.delete_many({})
    await db.events.delete_many({})
    await db.colleges.delete_many({})
    await db.results.delete_many({})
    print("✓ Cleared\n")
    
    # Create Admin
    print("Creating Admin User...")
    admin_id = str(uuid.uuid4())
    admin_password = "admin123"
    admin_doc = {
        "id": admin_id,
        "username": "Admin",
        "email": "admin@ignitron.com",
        "password_hash": hash_password(admin_password),
        "role": "admin",
        "event_ids": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(admin_doc)
    print(f"✓ Admin created")
    print(f"  Email: admin@ignitron.com")
    print(f"  Password: {admin_password}\n")
    
    # Create 23 Events
    print("Creating 23 Events...")
    event_ids = []
    for i, event_name in enumerate(EVENT_NAMES, 1):
        event_id = str(uuid.uuid4())
        event_ids.append(event_id)
        event_doc = {
            "id": event_id,
            "title": event_name,
            "code": f"EVENT{i:02d}",
            "coordinator_ids": []  # Will be updated when coordinators are created
        }
        await db.events.insert_one(event_doc)
    print(f"✓ Created {len(event_ids)} events\n")
    
    # Create 23 Coordinators (one per event)
    print("Creating 23 Coordinators...")
    coordinator_credentials = []
    for i, (event_id, event_name) in enumerate(zip(event_ids, EVENT_NAMES), 1):
        coordinator_id = str(uuid.uuid4())
        coordinator_email = f"coordinator{i}@ignitron.com"
        coordinator_password = f"coord{i}123"
        
        coordinator_doc = {
            "id": coordinator_id,
            "username": f"Coordinator {i}",
            "email": coordinator_email,
            "password_hash": hash_password(coordinator_password),
            "role": "coordinator",
            "event_ids": [event_id],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(coordinator_doc)
        
        # Update event with coordinator
        await db.events.update_one(
            {"id": event_id},
            {"$set": {"coordinator_ids": [coordinator_id]}}
        )
        
        coordinator_credentials.append({
            "number": i,
            "event": event_name,
            "email": coordinator_email,
            "password": coordinator_password
        })
    
    print(f"✓ Created 23 coordinators\n")
    
    # Create Colleges
    print("Creating Colleges...")
    college_ids = []
    for i, college_name in enumerate(COLLEGE_NAMES, 1):
        college_id = str(uuid.uuid4())
        college_ids.append(college_id)
        college_doc = {
            "id": college_id,
            "name": college_name,
            "code": f"CLG{i:02d}",
            "total_points": 0
        }
        await db.colleges.insert_one(college_doc)
    print(f"✓ Created {len(COLLEGE_NAMES)} colleges\n")
    
    # Create Sample Results with manual points and achievement statements
    print("Creating Sample Results...")
    import random
    
    # Create some sample results to demonstrate the new system
    sample_results_created = 0
    for i in range(15):  # Create 15 sample results
        event_id = random.choice(event_ids)
        college_id = random.choice(college_ids)
        points = random.choice([50, 100, 150, 200, 250, 300])
        achievement = random.choice(ACHIEVEMENT_STATEMENTS)
        
        # Get a coordinator for this event
        event = await db.events.find_one({"id": event_id})
        if event and event.get("coordinator_ids"):
            coordinator_id = event["coordinator_ids"][0]
            
            result_id = str(uuid.uuid4())
            result_doc = {
                "id": result_id,
                "event_id": event_id,
                "college_id": college_id,
                "points": points,
                "achievement_statement": achievement,
                "recorded_by": coordinator_id,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            await db.results.insert_one(result_doc)
            
            # Update college points
            await db.colleges.update_one(
                {"id": college_id},
                {"$inc": {"total_points": points}}
            )
            
            sample_results_created += 1
    
    print(f"✓ Created {sample_results_created} sample results with manual points and achievement statements\n")
    
    print("="*60)
    print("Seeding Complete!")
    print("="*60 + "\n")
    
    print("\n📋 COORDINATOR CREDENTIALS:\n")
    print("-" * 80)
    print(f"{'#':<4} {'Event Name':<30} {'Email':<30} {'Password':<15}")
    print("-" * 80)
    for cred in coordinator_credentials:
        print(f"{cred['number']:<4} {cred['event']:<30} {cred['email']:<30} {cred['password']:<15}")
    print("-" * 80)
    
    print("\n💡 Quick Access:")
    print(f"   Admin: admin@ignitron.com / admin123")
    print(f"   Coordinator 1: coordinator1@ignitron.com / coord1123")
    print(f"   Coordinator 2: coordinator2@ignitron.com / coord2123")
    print("   ... and so on\n")
    
    # Show sample leaderboard
    print("🏆 SAMPLE LEADERBOARD (After Seeding):")
    print("-" * 60)
    colleges = await db.colleges.find({}, {"_id": 0}).sort("total_points", -1).to_list(10)
    print(f"{'Rank':<6} {'College':<30} {'Points':<10}")
    print("-" * 60)
    for idx, college in enumerate(colleges, 1):
        print(f"{idx:<6} {college['name']:<30} {college['total_points']:<10}")
    print("-" * 60)

if __name__ == "__main__":
    asyncio.run(seed_database())
    print("Database seeding completed successfully!")